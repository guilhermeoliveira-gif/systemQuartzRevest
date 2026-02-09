import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const TestConnection: React.FC = () => {
    const [status, setStatus] = useState<string>('Testando...');
    const [envCheck, setEnvCheck] = useState<any>({});
    const [dbCheck, setDbCheck] = useState<any>({});
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        runDiagnostics();
    }, []);

    const runDiagnostics = async () => {
        setStatus('Iniciando diagnóstico...');

        // 1. Check Environment Variables
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const envStatus = {
            hasUrl: !!url,
            urlValue: url ? `${url.substring(0, 8)}...${url.substring(url.length - 5)}` : 'MISSING',
            hasKey: !!key,
            keyValue: key ? `${key.substring(0, 5)}...` : 'MISSING'
        };
        setEnvCheck(envStatus);

        if (!url || !key) {
            setStatus('FALHA: Variáveis de ambiente ausentes.');
            return;
        }

        // 2. Test Connection (Simple Select)
        try {
            const start = performance.now();
            const { data, error, count } = await supabase
                .from('frota_veiculos')
                .select('count', { count: 'exact', head: true });

            const time = performance.now() - start;

            if (error) {
                setDbCheck({ success: false, message: error.message, code: error.code, details: error.details, time: `${time.toFixed(0)}ms` });
                setStatus('FALHA: Erro ao conectar no Banco.');
            } else {
                setDbCheck({ success: true, message: 'Conexão OK', count, time: `${time.toFixed(0)}ms` });
                setStatus('SUCESSO: Conexão estabelecida.');
            }
        } catch (err: any) {
            setError(err);
            setStatus('FALHA CRÍTICA: Exceção capturada.');
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto bg-white shadow-lg rounded-xl mt-10">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Diagnóstico de Conexão</h1>

            <div className={`p-4 rounded-lg mb-6 ${status.includes('SUCESSO') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <strong>Status Final:</strong> {status}
            </div>

            <div className="space-y-6">
                <section>
                    <h2 className="text-lg font-semibold mb-2 border-b pb-1">1. Variáveis de Ambiente (.env)</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm font-mono bg-slate-50 p-4 rounded border">
                        <div>VITE_SUPABASE_URL:</div>
                        <div className={envCheck.hasUrl ? 'text-green-600' : 'text-red-600'}>{envCheck.urlValue}</div>

                        <div>VITE_SUPABASE_ANON_KEY:</div>
                        <div className={envCheck.hasKey ? 'text-green-600' : 'text-red-600'}>{envCheck.keyValue}</div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-2 border-b pb-1">2. Teste de Banco de Dados</h2>
                    <div className="bg-slate-50 p-4 rounded border text-sm">
                        {dbCheck.success ? (
                            <div className="text-green-600">
                                <p>✅ Tabela 'frota_veiculos' encontrada.</p>
                                <p>⏱️ Tempo de resposta: {dbCheck.time}</p>
                            </div>
                        ) : (
                            <div className="text-red-600">
                                <p>❌ Falha na consulta.</p>
                                <p>Erro: {dbCheck.message}</p>
                                {dbCheck.code && <p>Código: {dbCheck.code}</p>}
                                <p>Tempo: {dbCheck.time}</p>
                            </div>
                        )}
                    </div>
                </section>

                {error && (
                    <section>
                        <h2 className="text-lg font-semibold mb-2 border-b pb-1">3. Erro Crítico (Exceção)</h2>
                        <pre className="bg-red-50 p-4 rounded border text-xs text-red-800 overflow-auto whitespace-pre-wrap">
                            {JSON.stringify(error, null, 2)}
                        </pre>
                    </section>
                )}

                <button
                    onClick={runDiagnostics}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
                >
                    Rodar Teste Novamente
                </button>
            </div>
        </div>
    );
};

export default TestConnection;
