async function testNewProxyUrl() {
    const url = 'https://api.fastestcrm.com/api/submit-external-lead';
    const payload = {
        "formId": "5f7d31e1-1a2a-4bc6-9ee8-375649fd2550",
        "data": {
            "name": "John Doe T (Proxy Test)",
            "email": "user@exaxzmple.com",
            "phone": "9876597510",
            "status": "new"
        }
    };

    console.log(`\n=== Testing Hit to ${url} (NO HEADERS) ===`);
    console.log(`(Note: This requires the latest code to be DEPLOYED to Vercel first)`);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response Body:', text.substring(0, 500));
    } catch (e) {
        console.log('Error:', e.message);
    }
}

testNewProxyUrl();
