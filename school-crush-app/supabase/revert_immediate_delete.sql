-- ==========================================
-- RESTORE MODERATION: WAIT FOR AI OR 3 REPORTS
-- ==========================================

CREATE OR REPLACE FUNCTION public.apply_moderation_to_post()
RETURNS trigger AS $$
DECLARE
    report_count int;
    post_author uuid;
BEGIN
    -- Nur bei Meldungen für POSTS aktiv werden
    IF NEW.target_type = 'post' THEN
        -- Zähle Meldungen für diesen Post
        SELECT count(*) INTO report_count 
        FROM public.reports 
        WHERE target_id = NEW.target_id AND target_type = 'post';
        
        -- Ab 3 Meldungen: Manuell einschreiten (Community Moderation)
        IF report_count >= 3 THEN
            -- Autor finden
            SELECT user_id INTO post_author 
            FROM public.posts 
            WHERE id = NEW.target_id;
            
            IF post_author IS NOT NULL THEN
                -- Strike geben
                UPDATE public.profiles 
                SET strikes = strikes + 1 
                WHERE id = post_author;
                
                -- Post löschen
                DELETE FROM public.posts WHERE id = NEW.target_id;
                
                RAISE NOTICE 'Post % wurde nach 3 Meldungen gelöscht.', NEW.target_id;
            END IF;
        END IF;
    END IF;
    -- WICHTIG: Das Löschen passiert jetzt NICHT mehr sofort bei 1 Meldung.
    -- Stattdessen übernimmt die KI-Funktion in der App die Bewertung bei jeder Meldung.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sicherstellen
DROP TRIGGER IF EXISTS on_report_submitted ON public.reports;
CREATE TRIGGER on_report_submitted
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.apply_moderation_to_post();
