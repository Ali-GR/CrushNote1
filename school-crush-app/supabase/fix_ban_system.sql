-- ==========================================
-- BAN SYSTEM: AUTO-DELETE CONTENT ON 3 STRIKES
-- ==========================================

-- Function to delete all user content when banned
CREATE OR REPLACE FUNCTION public.handle_user_ban()
RETURNS trigger AS $$
BEGIN
    -- Check if the user has reached 3 or more strikes
    IF NEW.strikes >= 3 AND (OLD.strikes < 3 OR OLD.strikes IS NULL) THEN
        -- Delete all posts by this user
        -- (This will also delete comments on these posts via cascade)
        DELETE FROM public.posts WHERE user_id = NEW.id;
        
        -- Delete all comments made by this user on other posts
        DELETE FROM public.comments WHERE user_id = NEW.id;
        
        -- Delete all likes made by this user
        DELETE FROM public.likes WHERE user_id = NEW.id;
        
        RAISE NOTICE 'User % has been banned and their content deleted.', NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to watch for strike updates
DROP TRIGGER IF EXISTS on_profile_banned ON public.profiles;
CREATE TRIGGER on_profile_banned
AFTER UPDATE OF strikes ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_ban();

-- Also ensure that content is deleted if someone is created with 3 strikes (unlikely but safe)
DROP TRIGGER IF EXISTS on_profile_banned_insert ON public.profiles;
CREATE TRIGGER on_profile_banned_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_ban();
