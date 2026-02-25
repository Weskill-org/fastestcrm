import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
    console.log('Testing get_subdomain_company...');
    const { data, error } = await supabase.rpc('get_subdomain_company', { _slug: 'weskill' });
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('Error:', error);
}

test();
