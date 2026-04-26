-- ==========================================
-- IMMEDIATE MODERATION: DELETE ON FIRST REPORT
-- ==========================================

CREATE OR REPLACE FUNCTION public.apply_moderation_to_post()
RETURNS trigger AS $$
DECLARE
    post_author uuid;
BEGIN
    -- Nur bei Meldungen für POSTS aktiv werden
    IF NEW.target_type = 'post' THEN
        -- Autor finden (bevor wir den Post löschen)
        SELECT user_id INTO post_author 
        FROM public.posts 
        WHERE id = NEW.target_id;
        
        IF post_author IS NOT NULL THEN
            -- 1. Strike geben (optional, aber sinnvoll im Bansystem)
            UPDATE public.profiles 
            SET strikes = strikes + 1 
            WHERE id = post_author;
            
            -- 2. Post SOFORT löschen
            DELETE FROM public.posts WHERE id = NEW.target_id;
            
            RAISE NOTICE 'Post % wurde gemeldet und sofort gelöscht.', NEW.target_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sicherstellen
DROP TRIGGER IF EXISTS on_report_submitted ON public.reports;
CREATE TRIGGER on_report_submitted
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.apply_moderation_to_post();
