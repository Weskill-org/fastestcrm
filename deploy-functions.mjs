/**
 * Deploys Supabase edge functions using the Management API.
 * Does NOT require Docker.
 * Usage: node deploy-functions.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = 'uykdyqdeyilpulaqlqip';
// Set your Supabase personal access token as env var: SUPABASE_ACCESS_TOKEN
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
    console.error('ERROR: Set SUPABASE_ACCESS_TOKEN env variable first.');
    console.error('Get it from: https://supabase.com/dashboard/account/tokens');
    process.exit(1);
}

const BASE_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions`;

async function deployFunction(name) {
    const fnFile = path.join(__dirname, 'supabase', 'functions', name, 'index.ts');
    const sharedCors = path.join(__dirname, 'supabase', 'functions', '_shared', 'cors.ts');

    let code = fs.readFileSync(fnFile, 'utf8');
    const corsCode = fs.readFileSync(sharedCors, 'utf8');

    // Inline the cors import
    code = code.replace(
        `import { corsHeaders } from '../_shared/cors.ts'`,
        `// Inlined cors.ts\n${corsCode.replace('export ', '')}`
    ).replace(
        `import { corsHeaders } from "../_shared/cors.ts";`,
        `// Inlined cors.ts\n${corsCode.replace('export ', '')}`
    );

    const url = `${BASE_URL}/${name}`;

    // Try PATCH (update existing) first, then POST (create new)
    let response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            body: code,
            verify_jwt: true,
        }),
    });

    if (response.status === 404) {
        // Function doesn't exist yet, create it
        response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                body: code,
                verify_jwt: true,
            }),
        });
    }

    const result = await response.text();
    if (response.ok) {
        console.log(`✅ Deployed ${name}: ${response.status}`);
    } else {
        console.error(`❌ Failed to deploy ${name}: ${response.status} ${result}`);
    }
}

async function main() {
    console.log('Deploying functions via Supabase Management API...\n');
    await deployFunction('process-reminders');
    await deployFunction('send-web-push');
    console.log('\nDone!');
}

main().catch(console.error);
