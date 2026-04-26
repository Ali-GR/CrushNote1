-- ============================================================
-- PREMIUM FEATURES MIGRATION
-- Führe dieses SQL in deinem Supabase SQL Editor aus!
-- ============================================================

-- 1. is_premium Spalte zu profiles hinzufügen
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- 2. gif_url Spalte zu comments hinzufügen (für Memes/GIFs)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS gif_url TEXT;

-- 3. RLS Policy: Nutzer können ihren own is_premium Status lesen
-- (wird durch bestehende "SELECT *" Policy abgedeckt)

-- Fertig! Teste mit:
-- SELECT id, nickname, is_premium FROM profiles LIMIT 5;
