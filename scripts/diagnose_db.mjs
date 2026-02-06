
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Leitura manual simples do .env.local
const envPath = path.join(rootDir, '.env.local');
let env = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            env[key] = value;
        }
    });
} catch (e) {
    console.error("Erro lendo .env.local:", e.message);
}

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("❌ Credenciais não encontradas. Verifique .env.local");
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    console.log("🔍 [DIAGNÓSTICO] Testando conexão com Supabase...");

    // 1. Testar Existência da Tabela
    const { data, error: selectError } = await supabase.from('materia_prima').select('count', { count: 'exact', head: true });

    if (selectError) {
        if (selectError.code === '42P01') {
            console.log("\n🔴 FALHA CRÍTICA: TABELA NÃO EXISTE");
            console.log("O erro 'Relation does not exist' indica que o Script SQL não foi rodado.");
            console.log("👉 AÇÃO: Copie o conteúdo de 'supabase_schema.sql' e execute no SQL Editor do Supabase.");
        } else {
            console.log("\n🔴 ERRO DE CONEXÃO/LEITURA:");
            console.log(JSON.stringify(selectError, null, 2));
        }
        return;
    }
    console.log("✅ Tabela 'materia_prima' encontrada. Leitura OK.");

    // 2. Testar Permissão de Escrita (RLS)
    const testeItem = {
        nome: '__TESTE_DIAGNOSTICO__',
        unidade_medida: 'un',
        quantidade_atual: 0,
        organization_id: 'TEST'
    };

    const { data: insertData, error: insertError } = await supabase
        .from('materia_prima')
        .insert(testeItem)
        .select()
        .single();

    if (insertError) {
        console.log("\n🔴 ERRO DE PERMISSÃO (Escrita):");
        console.log(JSON.stringify(insertError, null, 2));
        console.log("👉 Verificar se RLS Policies estão ativas para Public/Anon.");
    } else {
        console.log("✅ Permissão de escrita OK.");
        // Limpar
        await supabase.from('materia_prima').delete().eq('id', insertData.id);
        console.log("✅ Limpeza de teste OK.");
        console.log("\n🎉 DIAGNÓSTICO: O Backend parece 100% funcional. O erro pode estar no Frontend.");
    }
}

test();
