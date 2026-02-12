
import { createClient } from '@supabase/supabase-js';

// Load env vars
// Load env vars with fallback for Node.js environment (scripts)
// Load env vars with fallback for Node.js environment (scripts)
// 1. Tentar obter do Vite (Substituição estática na build)
// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// @ts-ignore
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    const msg = `CRITICAL: Supabase credentials missing.
    URL: ${supabaseUrl ? 'Defined' : 'Missing'}
    Key: ${supabaseKey ? 'Defined' : 'Missing'}
    
    Verifique se o arquivo .env ou .env.local existe e contém as chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.`;

    console.error(msg);
    // Lançar erro para ser pego pelo GlobalErrorProvider na tela
    throw new Error(msg);
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'quartz_revest_auth',
        // @ts-ignore - Propriedade necessária para resolver o erro de navigatorLock timeout
        lockSession: false
    }
} as any);
