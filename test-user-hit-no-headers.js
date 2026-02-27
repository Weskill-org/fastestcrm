async function testUserPayloadNoHeaders() {
    const url = 'https://api.fastestcrm.com/functions/v1/submit-external-lead';
    const payload = {
        "formId": "5f7d31e1-1a2a-4bc6-9ee8-375649fd2550",
        "data": {
            "name": "John Doe T",
            "email": "user@exaxzmple.com",
            "phone": "9876597510",
            "property_name": "value",
            "notes": "value",
            "status": "new",
            "lead_source": "value",
            "utm_source": "google",
            "utm_medium": "cpc"
        }
    };

    console.log(`\n=== Testing Hit to ${url} (WITHOUT HEADERS) ===`);

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
        console.log('Response Body:', text);
    } catch (e) {
        console.log('Error:', e.message);
    }
}

testUserPayloadNoHeaders();
