import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5a2R5cWRleWlscHVsYXFscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODgzOTksImV4cCI6MjA4MDM2NDM5OX0.JAcwAdJWnKod0jdc5BSenPOiJw77eTa49bA7inBWMoY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
    });
    console.log('AUTH ERROR:', error);
}

testAuth();
