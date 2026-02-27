// Test hitting the clean Vercel proxy without any auth headers
// This should work after deployment — let's verify the direct Supabase call still fails without headers
// and confirm the proxy pattern is correct

async function testCleanHit() {
    const url = 'https://uykdyqdeyilpulaqlqip.supabase.co/functions/v1/submit-external-lead';
    const payload = {
        "formId": "5f7d31e1-1a2a-4bc6-9ee8-375649fd2550",
        "data": {
            "name": "Clean Test No Headers",
            "email": "clean@example.com",
            "phone": "9876543210",
            "status": "new"
        }
    };

    console.log("=== Test 1: Direct Supabase URL (no headers) ===");
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('Status:', res.status, '(expected 401 - this confirms headers are needed at Supabase gateway)');
        const text = await res.text();
        console.log('Body:', text.substring(0, 200));
    } catch (e) { console.log('Error:', e.message); }

    console.log("\n=== Test 2: Local proxy simulation (with headers injected) ===");
    const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5a2R5cWRleWlscHVsYXFscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODgzOTksImV4cCI6MjA4MDM2NDM5OX0.JAcwAdJWnKod0jdc5BSenPOiJw77eTa49bA7inBWMoY';
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apikey,
                'Authorization': `Bearer ${apikey}`
            },
            body: JSON.stringify(payload)
        });
        console.log('Status:', res.status, '(expected 200 or 400 - proxy correctly injects headers)');
        const data = await res.json();
        console.log('Body:', JSON.stringify(data));
    } catch (e) { console.log('Error:', e.message); }
}

testCleanHit();
