// Vercel serverless proxy for submit-external-lead
// Injects the required Supabase API key so callers only need to POST JSON.
export default async function handler(req, res) {
    // Only allow POST (and OPTIONS for CORS preflight)
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const SUPABASE_URL = 'https://uykdyqdeyilpulaqlqip.supabase.co';
    const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5a2R5cWRleWlscHVsYXFscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODgzOTksImV4cCI6MjA4MDM2NDM5OX0.JAcwAdJWnKod0jdc5BSenPOiJw77eTa49bA7inBWMoY';

    try {
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/submit-external-lead`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': ANON_KEY,
                    'Authorization': `Bearer ${ANON_KEY}`,
                },
                body: JSON.stringify(req.body),
            }
        );

        const data = await response.json();

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Proxy error: ' + error.message });
    }
}
