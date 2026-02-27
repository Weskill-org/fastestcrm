const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5a2R5cWRleWlscHVsYXFscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODgzOTksImV4cCI6MjA4MDM2NDM5OX0.JAcwAdJWnKod0jdc5BSenPOiJw77eTa49bA7inBWMoY';

async function testProxy() {
    const endpoints = [
        'functions/v1/get-public-form',
        'functions/v1/submit-public-form',
        'rest/v1/leads?select=*&limit=1'
    ];

    for (const endpoint of endpoints) {
        const url = `https://api.fastestcrm.com/${endpoint}`;
        console.log(`\n=== Testing ${url} ===`);

        // Test without headers
        console.log("--- Without Headers ---");
        try {
            const res = await fetch(url, { method: endpoint.startsWith('functions') ? 'POST' : 'GET' });
            console.log('Status:', res.status);
            const text = await res.text();
            console.log('Body snippet:', text.substring(0, 100));
        } catch (e) {
            console.log('Error:', e.message);
        }

        // Test with headers
        console.log("--- With Headers ---");
        try {
            const res = await fetch(url, {
                method: endpoint.startsWith('functions') ? 'POST' : 'GET',
                headers: {
                    'apikey': apikey,
                    'Authorization': `Bearer ${apikey}`,
                    'Content-Type': 'application/json'
                },
                body: endpoint.startsWith('functions') ? JSON.stringify({ formId: 'test' }) : undefined
            });
            console.log('Status:', res.status);
            const text = await res.text();
            console.log('Body snippet:', text.substring(0, 100));
        } catch (e) {
            console.log('Error:', e.message);
        }
    }
}

testProxy();
