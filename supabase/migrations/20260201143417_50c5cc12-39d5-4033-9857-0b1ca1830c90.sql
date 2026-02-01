-- Create user_sessions table to track active sessions
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_token text NOT NULL,
  device_info text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_token)
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON public.user_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
ON public.user_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON public.user_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
ON public.user_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_created_at ON public.user_sessions(user_id, created_at);

-- Function to enforce session limit (max 2 sessions per user)
CREATE OR REPLACE FUNCTION public.enforce_session_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_count INTEGER;
  sessions_to_delete uuid[];
BEGIN
  -- Count existing sessions for this user
  SELECT COUNT(*) INTO session_count
  FROM public.user_sessions
  WHERE user_id = NEW.user_id;

  -- If we now have more than 2 sessions (including the new one), delete oldest
  IF session_count >= 2 THEN
    -- Get IDs of sessions to delete (all except the 2 newest including current)
    SELECT ARRAY_AGG(id) INTO sessions_to_delete
    FROM (
      SELECT id
      FROM public.user_sessions
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC
      OFFSET 2
    ) old_sessions;

    -- Delete old sessions
    IF sessions_to_delete IS NOT NULL AND array_length(sessions_to_delete, 1) > 0 THEN
      DELETE FROM public.user_sessions
      WHERE id = ANY(sessions_to_delete);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to enforce limit after insert
CREATE TRIGGER enforce_session_limit_trigger
AFTER INSERT ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_session_limit();