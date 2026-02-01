-- Drop the user_sessions table and related objects
DROP TRIGGER IF EXISTS enforce_session_limit_trigger ON public.user_sessions;
DROP FUNCTION IF EXISTS public.enforce_session_limit();
DROP TABLE IF EXISTS public.user_sessions;

-- Add active_sessions JSONB column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active_sessions jsonb DEFAULT '[]'::jsonb;

-- Create function to manage sessions (enforce max 2)
CREATE OR REPLACE FUNCTION public.register_user_session(
  p_user_id uuid,
  p_session_token text,
  p_device_info text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sessions jsonb;
  v_new_session jsonb;
  v_existing_index int;
BEGIN
  -- Get current sessions
  SELECT COALESCE(active_sessions, '[]'::jsonb) INTO v_sessions
  FROM public.profiles
  WHERE id = p_user_id;

  -- Create new session object
  v_new_session := jsonb_build_object(
    'token', p_session_token,
    'device_info', p_device_info,
    'created_at', now()::text,
    'last_active', now()::text
  );

  -- Check if session already exists (update last_active)
  SELECT i - 1 INTO v_existing_index
  FROM jsonb_array_elements(v_sessions) WITH ORDINALITY arr(elem, i)
  WHERE elem->>'token' = p_session_token
  LIMIT 1;

  IF v_existing_index IS NOT NULL THEN
    -- Update existing session's last_active
    v_sessions := jsonb_set(
      v_sessions,
      ARRAY[v_existing_index::text, 'last_active'],
      to_jsonb(now()::text)
    );
  ELSE
    -- Add new session
    v_sessions := v_sessions || jsonb_build_array(v_new_session);
    
    -- Keep only latest 2 sessions (by created_at)
    IF jsonb_array_length(v_sessions) > 2 THEN
      SELECT jsonb_agg(elem ORDER BY (elem->>'created_at')::timestamp DESC)
      INTO v_sessions
      FROM (
        SELECT elem
        FROM jsonb_array_elements(v_sessions) elem
        ORDER BY (elem->>'created_at')::timestamp DESC
        LIMIT 2
      ) sub;
    END IF;
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET active_sessions = v_sessions
  WHERE id = p_user_id;

  RETURN v_sessions;
END;
$$;

-- Function to validate session
CREATE OR REPLACE FUNCTION public.validate_user_session(
  p_user_id uuid,
  p_session_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.profiles,
    jsonb_array_elements(COALESCE(active_sessions, '[]'::jsonb)) elem
    WHERE id = p_user_id
    AND elem->>'token' = p_session_token
  ) INTO v_exists;

  -- Update last_active if session exists
  IF v_exists THEN
    UPDATE public.profiles
    SET active_sessions = (
      SELECT jsonb_agg(
        CASE 
          WHEN elem->>'token' = p_session_token 
          THEN jsonb_set(elem, '{last_active}', to_jsonb(now()::text))
          ELSE elem
        END
      )
      FROM jsonb_array_elements(active_sessions) elem
    )
    WHERE id = p_user_id;
  END IF;

  RETURN v_exists;
END;
$$;

-- Function to remove session on logout
CREATE OR REPLACE FUNCTION public.remove_user_session(
  p_user_id uuid,
  p_session_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET active_sessions = (
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(active_sessions, '[]'::jsonb)) elem
    WHERE elem->>'token' != p_session_token
  )
  WHERE id = p_user_id;
END;
$$;