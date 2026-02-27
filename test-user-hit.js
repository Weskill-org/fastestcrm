const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5a2R5cWRleWlscHVsYXFscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODgzOTksImV4cCI6MjA4MDM2NDM5OX0.JAcwAdJWnKod0jdc5BSenPOiJw77eTa49bA7inBWMoY';

async function testUserPayload() {
    const url = 'https://api.fastestcrm.com/functions/v1/submit-external-lead';
    const payload = {
        "formId": "5f7d31e1-1a2a-4bc6-9ee8-375649fd2550",
        "data": {
            "name": "John Doe T",
            "email": "user@example.com",
            "phone": "9876593210",
            "property_name": "value",
            "notes": "value",
            "status": "new",
            "lead_source": "value",
            "utm_source": "google",
            "utm_medium": "cpc"
        }
    };

    console.log(`\n=== Testing Hit to ${url} ===`);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': apikey,
                'Authorization': `Bearer ${apikey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.log('Error:', e.message);
    }
}

testUserPayload();
