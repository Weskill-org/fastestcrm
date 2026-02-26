const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5a2R5cWRleWlscHVsYXFscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODgzOTksImV4cCI6MjA4MDM2NDM5OX0.JAcwAdJWnKod0jdc5BSenPOiJw77eTa49bA7inBWMoY';

async function testRpc() {
    const url = 'https://api.fastestcrm.com/rest/v1/rpc/get_subdomain_company';
    console.log("=== Testing RPC POST ===");
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': apikey,
            'Authorization': `Bearer ${apikey}`,
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:8080'
        },
        body: JSON.stringify({ _slug: 'weskill' })
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
}

testRpc();
