const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5a2R5cWRleWlscHVsYXFscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODgzOTksImV4cCI6MjA4MDM2NDM5OX0.JAcwAdJWnKod0jdc5BSenPOiJw77eTa49bA7inBWMoY';

async function testLeads() {
    const url = 'https://api.fastestcrm.com/rest/v1/leads?select=*&limit=1';
    console.log("=== Testing LEADS GET ===");
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'apikey': apikey,
            'Authorization': `Bearer ${apikey}`,
            'Origin': 'http://localhost:8080'
        }
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.substring(0, 500));
}

testLeads();
