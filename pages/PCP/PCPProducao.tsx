
import React, { useState, useEffect } from 'react';
import {
    Play, Square, CheckCircle2, AlertCircle,
    ArrowDownCircle, Package, User, Clock
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { pcpService } from '../../services/pcpService';
import { ItemPlanoProducao, RegistroProducao } from '../../types_pcp';
import { useToast } from '../../contexts/ToastContext';

const PCPProducao: React.FC = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [itemAtivo, setItemAtivo] = useState<ItemPlanoProducao | null>(null);
    const [registroAtivo, setRegistroAtivo] = useState<RegistroProducao | null>(null);
    const [proximas, setProximas] = useState<ItemPlanoProducao[]>([]);

    // Form control
    const [isProduzindo, setIsProduzindo] = useState(false);
    const [contadores, setContadores] = useState({
        c1: 0,
        c2: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const planos = await pcpService.getPlanos();
            const allItens: ItemPlanoProducao[] = [];
            planos.forEach(p => {
                if (p.itens) allItens.push(...p.itens);
            });

            // Encontra o primeiro item 'Produzindo' ou 'Aguardando'
            const ativo = allItens.find(i => i.status === 'Produzindo');
            const proximasPool = allItens.filter(i => i.status === 'Aguardando');

            if (ativo) {
                setItemAtivo(ativo);
                setIsProduzindo(true);
                // Carregar registro ativo (simplificado: pega o último registro deste item)
                const historico = await pcpService.getHistorico();
                const reg = historico.find(r => r.id_item_plano_producao === ativo.id && !r.data_hora_fim);
                setRegistroAtivo(reg);
                if (reg) {
                    setContadores({ c1: Number(reg.contador1_inicio), c2: Number(reg.contador2_inicio) });
                }
            } else if (proximasPool.length > 0) {
                setItemAtivo(proximasPool[0]);
                setProximas(proximasPool.slice(1));
            } else {
                setItemAtivo(null);
                setProximas([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleIniciar = async () => {
        if (!itemAtivo) return;
        try {
            const novoRegistro = await pcpService.iniciarProducao({
                id_item_plano_producao: itemAtivo.id,
                nome_operador: 'Operador Padrão', // Placeholder
                contador1_inicio: contadores.c1,
                contador2_inicio: contadores.c2
            });

            setRegistroAtivo(novoRegistro);
            setIsProduzindo(true);
            toast.success('Sucesso', '✅ Operação de produção registrada!', { style: { backgroundColor: '#22c55e', color: 'white' } });
            loadData();
        } catch (error) {
            toast.error('Erro', '❌ Erro ao iniciar produção.');
        }
    };

    const handleFinalizar = async () => {
        if (!registroAtivo || !itemAtivo) return;

        // Simples validação de contadores
        if (contadores.c1 <= Number(registroAtivo.contador1_inicio)) {
            toast.error('Erro', '❌ Erro: Verifique os valores do contador (deve ser maior que o inicial).', { style: { backgroundColor: '#ef4444', color: 'white' } });
            return;
        }

        try {
            await pcpService.finalizarProducao(registroAtivo.id, {
                contador1_fim: contadores.c1,
                contador2_fim: contadores.c2,
                qtd_realizada: itemAtivo.qtd_misturas_planejadas // Placeholder para qtd_realizada
            });

            setIsProduzindo(false);
            setRegistroAtivo(null);
            setContadores({ c1: 0, c2: 0 });
            toast.success('Sucesso', '✅ Produção finalizada com sucesso!', { style: { backgroundColor: '#22c55e', color: 'white' } });

            // Simulação de envio de notificação (WhatsApp/SMS)
            console.log("NOTIFICAÇÃO ENVIADA: Produção de " + itemAtivo.nome_produto_acabado + " finalizada!");

            loadData();
        } catch (error) {
            toast.error('Erro', 'Falha ao finalizar operação.');
        }
    };

    if (loading) return <div className="p-10 text-center font-mono">Carregando painel do operador...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Seção Produção Atual */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className={`p-1 text-center text-[10px] font-black uppercase tracking-[0.3em] ${isProduzindo ? 'bg-green-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                    {isProduzindo ? 'Produção em Curso' : 'Aguardando Início'}
                </div>

                <div className="p-10 space-y-8">
                    {itemAtivo ? (
                        <>
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl md:text-5xl font-black text-blue-800 tracking-tighter uppercase">{itemAtivo.nome_produto_acabado}</h2>
                                <div className="flex items-center justify-center gap-4 text-slate-400 font-bold uppercase tracking-widest text-xs">
                                    <span className="flex items-center gap-1"><Package size={14} /> {itemAtivo.qtd_misturas_planejadas} Misturas Planejadas</span>
                                    <span className="flex items-center gap-1"><User size={14} /> Operador: Operador Padrão</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contador 1 {isProduzindo ? 'Final' : 'Inicial'}</label>
                                    <input
                                        type="number"
                                        className="w-full text-4xl font-black p-6 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 text-slate-800 transition-all"
                                        value={contadores.c1}
                                        onChange={(e) => setContadores({ ...contadores, c1: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contador 2 {isProduzindo ? 'Final' : 'Inicial'}</label>
                                    <input
                                        type="number"
                                        className="w-full text-4xl font-black p-6 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 text-slate-800 transition-all"
                                        value={contadores.c2}
                                        onChange={(e) => setContadores({ ...contadores, c2: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                {isProduzindo ? (
                                    <Button
                                        onClick={handleFinalizar}
                                        className="w-full py-8 text-xl font-black bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg border-b-4 border-blue-900 active:border-b-0 translate-y-0 active:translate-y-1 transition-all"
                                    >
                                        <Square size={24} className="mr-3" /> FINALIZAR PRODUÇÃO
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleIniciar}
                                        className="w-full py-8 text-xl font-black bg-green-600 hover:bg-green-700 rounded-2xl shadow-lg border-b-4 border-green-900 active:border-b-0 translate-y-0 active:translate-y-1 transition-all"
                                    >
                                        <Play size={24} className="mr-3" /> INICIAR PRODUÇÃO
                                    </Button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-10 space-y-4">
                            <CheckCircle2 size={64} className="mx-auto text-green-500" />
                            <h3 className="text-2xl font-black text-slate-800">Tudo em dia!</h3>
                            <p className="text-slate-400 font-medium italic">Nenhuma produção pendente no momento.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Rodapé: Próximas Produções */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 border-dashed">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <ArrowDownCircle size={18} /> Próximas Produções
                </h3>
                <div className="flex flex-wrap gap-2">
                    {proximas.map((p, i) => (
                        <div key={p.id} className="bg-white px-4 py-2 rounded-full border border-slate-200 text-sm font-bold text-slate-600 flex items-center gap-2">
                            <span className="text-slate-300">#{i + 1}</span>
                            {p.nome_produto_acabado}
                        </div>
                    ))}
                    {proximas.length === 0 && <span className="text-slate-400 italic text-sm">Nenhuma programada.</span>}
                </div>
            </div>

            {/* Info bar */}
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">
                <span className="flex items-center gap-1"><Clock size={12} /> Última sincronização: Agora</span>
                <span className="text-blue-600">QuartzRevest PCP Operations</span>
            </div>
        </div>
    );
};

export default PCPProducao;
