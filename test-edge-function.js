// Test script to call the Edge Function
const SUPABASE_URL = 'https://uykdyqdeyilpulaqlqip.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5a2R5cWRleWlscHVsYXFscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODgzOTksImV4cCI6MjA4MDM2NDM5OX0.JAcwAdJWnKod0jdc5BSenPOiJw77eTa49bA7inBWMoY';

async function testEdgeFunction() {
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/query-bigdata-sql`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'list_tables' })
        });

        const data = await response.json();

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('\n=== ERROR ===');
            console.error('Message:', data.error || data);
        }
    } catch (error) {
        console.error('Caught error:', error.message);
    }
}

testEdgeFunction();
