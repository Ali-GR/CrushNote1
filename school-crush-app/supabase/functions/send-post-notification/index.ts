
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    const { school_id, post_content, author_id } = await req.json();

    // 1. Supabase Client initialisieren
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Alle Nutzer der Schule mit einem Push-Token finden (außer dem Autor)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('school_id', school_id)
      .neq('id', author_id)
      .not('push_token', 'is', null);

    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: 'No recipients found' }), { status: 200 });
    }

    // 3. Tokens extrahieren
    const tokens = profiles.map(p => p.push_token);

    // 4. Benachrichtigungen an Expo senden
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: 'Neuer Crush! 💘',
      body: 'Jemand an deiner Schule hat sein Herz ausgeschüttet. Schau mal rein!',
      data: { type: 'new_post' },
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
})
