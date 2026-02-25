const fs = require('fs');
const path = require('path');

const functionsDir = path.join(__dirname, 'supabase', 'functions');
const sharedCorsPath = path.join(functionsDir, '_shared', 'cors.ts');

if (!fs.existsSync(path.dirname(sharedCorsPath))) {
    fs.mkdirSync(path.dirname(sharedCorsPath), { recursive: true });
}

fs.writeFileSync(sharedCorsPath, `export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, accept, prefer',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};
`);

const dirs = fs.readdirSync(functionsDir, { withFileTypes: true });

let updatedCount = 0;

dirs.forEach(dirent => {
    if (dirent.isDirectory() && dirent.name !== '_shared') {
        const indexPath = path.join(functionsDir, dirent.name, 'index.ts');
        if (fs.existsSync(indexPath)) {
            let content = fs.readFileSync(indexPath, 'utf8');

            let modified = false;

            // check explicit declaration
            if (content.match(/const\s+corsHeaders\s*=\s*\{[\s\S]*?\};/)) {
                content = content.replace(/const\s+corsHeaders\s*=\s*\{[\s\S]*?\};/g, '');
                modified = true;
            }
            // check local import
            else if (content.match(/import\s+\{\s*corsHeaders\s*\}\s+from\s+['"]\.\/cors(\.ts)?['"]/)) {
                content = content.replace(/import\s+\{\s*corsHeaders\s*\}\s+from\s+['"]\.\/cors(\.ts)?['"]/g, '');
                modified = true;
            }

            if (modified) {
                // Insert new import after the last import
                const importMatches = [...content.matchAll(/^import .*$/gm)];
                let insertPos = 0;
                if (importMatches.length > 0) {
                    const lastImport = importMatches[importMatches.length - 1];
                    insertPos = lastImport.index + lastImport[0].length;
                }

                const newImport = `\nimport { corsHeaders } from "../_shared/cors.ts";\n`;
                content = content.slice(0, insertPos) + newImport + content.slice(insertPos);

                fs.writeFileSync(indexPath, content);
                updatedCount++;
            } else if (!content.includes('import { corsHeaders }') && content.includes('corsHeaders')) {
                console.log(`Manual check needed for ${dirent.name}`);
            }
        }
    }
});
console.log('Updated ' + updatedCount + ' functions.');
