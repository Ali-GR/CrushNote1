const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('posts').insert({
    content: 'Test content',
    user_id: 'd277d3a2-9636-434a-b228-f70698aa5fa1',
    school_id: '61342bf8-8db7-4ba0-a9d9-2243f6a94fe4'
  });
  console.log(error);
}
run();
