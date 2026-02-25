-- Remove custom active_sessions column from profiles
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS active_sessions;

-- Drop custom session management functions
DROP FUNCTION IF EXISTS public.register_user_session(uuid, text, text);
DROP FUNCTION IF EXISTS public.validate_user_session(uuid, text);
DROP FUNCTION IF EXISTS public.remove_user_session(uuid, text);
