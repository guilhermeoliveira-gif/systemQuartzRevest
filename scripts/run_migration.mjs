
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Get project ID from .env.local because user didn't explicitly map Project REF -> URL in prompt
// But we know the URL is https://pbvwwhjyaciwsgibkrjo.supabase.co
// So the REF is pbvwwhjyaciwsgibkrjo
const PROJECT_REF = 'pbvwwhjyaciwsgibkrjo';
const ACCESS_TOKEN = 'sbp_325332737bbe782efa1ab0ad7d3e1e81b2396492';

const sqlPath = path.join(__dirname, '..', 'supabase_schema.sql');
const sqlQuery = fs.readFileSync(sqlPath, 'utf8');

async function runMigration() {
    console.log(`🚀 Iniciando migração para projeto: ${PROJECT_REF}`);

    try {
        const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify({ query: sqlQuery })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro API: ${response.status} - ${errorText}`);
        }

        // A API Management retorna o resultado direto
        const result = await response.json();
        console.log("✅ Sucesso! Tabelas criadas.");
        console.log("Resultado:", JSON.stringify(result, null, 2));

    } catch (error) {
        console.error("❌ Falha na migração:", error.message);

        // Fallback: Tentar endpoint Postgres direto se a Management API falhar 
        // (Nota: Supabase Management API via HTTP é a melhor aposta com Token Pessoal)
    }
}

runMigration();
