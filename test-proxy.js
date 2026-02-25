const SUPABASE_URL = 'https://uykdyqdeyilpulaqlqip.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5a2R5cWRleWlscHVsYXFscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODgzOTksImV4cCI6MjA4MDM2NDM5OX0.JAcwAdJWnKod0jdc5BSenPOiJw77eTa49bA7inBWMoY';

// We'll test against the direct supabase URL but pretend the origin is fastestcrm.com
// This simulates Vercel Proxy forwarding the request, or a direct client hit.
async function testCORSAndData() {
    try {
        console.log("Testing POST to get-public-form...");

        // Use a dummy UUID that won't exist but will test the endpoint logic and CORS
        const dummyFormId = '123e4567-e89b-12d3-a456-426614174000';

        const response = await fetch(`${SUPABASE_URL}/functions/v1/get-public-form`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'Content-Type': 'application/json',
                'Origin': 'https://fastestcrm.com' // Trigger CORS logic
            },
            body: JSON.stringify({ formId: dummyFormId })
        });

        const data = await response.json();

        console.log('Status:', response.status);
        console.log('Headers:');
        for (let [key, value] of response.headers.entries()) {
            if (key.toLowerCase().includes('access-control')) {
                console.log(`  ${key}: ${value}`);
            }
        }

        console.log('Response:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('\n=== ERROR ===');
            console.error('Message:', data.error || data);
        } else {
            console.log('\n=== SUCCESS ===');
        }
    } catch (error) {
        console.error('Caught error:', error.message);
    }
}

testCORSAndData();
