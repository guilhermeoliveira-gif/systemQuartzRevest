import React, { useState, useEffect, useCallback } from 'react';
import {
    Play, Square, CheckCircle2,
    ArrowDownCircle, Package, User, Clock
} from 'lucide-react';
import { pcpService } from '../../services/pcpService';
import { ItemPlanoProducao, RegistroProducao } from '../../types_pcp';
import { useToast } from '../../contexts/ToastContext';
import { estoqueService } from '../../services/estoqueService';
import { LoadingState } from '../../components/LoadingState';
import { logger } from '../../utils/logger';

// Interface auxiliar para os registros do histórico
interface HistoricoRegistro extends RegistroProducao {
    item?: {
        nome_produto_acabado?: string;
    };
    nome_produto_acabado?: string; // Fallback
}

const PCPProducao: React.FC = () => {
    const toast = useToast();
    const [proximas, setProximas] = useState<ItemPlanoProducao[]>([]);
    const [proximasPoolHistory, setProximasPoolHistory] = useState<HistoricoRegistro[]>([]);
    const [loading, setLoading] = useState(true);
    const [itemAtivo, setItemAtivo] = useState<ItemPlanoProducao | null>(null);
    const [registroAtivo, setRegistroAtivo] = useState<RegistroProducao | null>(null);

    // Formulário de Produção
    const [turnoAtual, setTurnoAtual] = useState('1º Turno');
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

            // Carregar histórico para pegar os últimos contadores se necessário
            const historico = await pcpService.getHistorico();

            // Encontra o primeiro item 'Produzindo' ou 'Aguardando'
            const ativo = allItens.find(i => i.status === 'Produzindo');
            const proximasPool = allItens.filter(i => i.status === 'Aguardando');

            if (ativo) {
                setItemAtivo(ativo);
                setIsProduzindo(true);
                // Carregar registro ativo
                const reg = historico.find(r => r.id_item_plano_producao === ativo.id && !r.data_hora_fim);
                setRegistroAtivo(reg || null);
                if (reg) {
                    setContadores({ c1: Number(reg.contador1_inicio), c2: Number(reg.contador2_inicio) });
                    if (reg.nome_operador) setTurnoAtual(reg.nome_operador);
                }
            } else {
                // DO NOT auto-select. Let the user choose from the pool.
                setItemAtivo(null);
                setProximas(proximasPool);
            }

            // Filtra histórico para mostrar apenas o que foi finalizado hoje
            const hoje = new Date().toISOString().split('T')[0];
            const finalizadosHoje = historico.filter(r => r.data_hora_fim && r.data_hora_fim.startsWith(hoje));
            setProximasPoolHistory(finalizadosHoje as any);

            logger.debug('PCP Produção carregado', {
                ativo: !!ativo,
                poolSize: proximasPool.length,
                historySize: finalizadosHoje.length
            });

        } catch (error) {
            logger.error('Erro ao carregar dados PCP', error);
            toast.error('Erro', 'Falha ao carregar dados de produção.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOrder = (item: ItemPlanoProducao) => {
        setItemAtivo(item);
        // Preenche com o final da última produção realizada (se houver) como sugestão inicial
        if (proximasPoolHistory.length > 0) {
            const ultimo = proximasPoolHistory[0]; // Assumindo ordenação por data desc no backend ou array
            setContadores({
                c1: Number(ultimo.contador1_fim) || 0,
                c2: Number(ultimo.contador2_fim) || 0
            });
        }
    };

    const handleCancelSelection = () => {
        setItemAtivo(null);
        setIsProduzindo(false);
        setContadores({ c1: 0, c2: 0 });
    };

    const handleIniciar = async () => {
        if (!itemAtivo) return;
        try {
            const novoRegistro = await pcpService.iniciarProducao({
                id_item_plano_producao: itemAtivo.id,
                nome_operador: turnoAtual, // Usa o turno selecionado
                contador1_inicio: contadores.c1,
                contador2_inicio: contadores.c2
            });

            setRegistroAtivo(novoRegistro);
            setIsProduzindo(true);
            toast.success('Sucesso', 'Produção iniciada com sucesso!', {
                // style: { backgroundColor: '#22c55e', color: 'white' } 
            });
            logger.info('Produção iniciada', { item: itemAtivo.nome_produto_acabado });
            loadData();
        } catch (error) {
            logger.error('Erro ao iniciar produção', error);
            toast.error('Erro', 'Não foi possível iniciar a produção.');
        }
    };

    const handleFinalizar = async () => {
        if (!registroAtivo || !itemAtivo) return;

        // Simples validação de contadores
        if (contadores.c1 <= Number(registroAtivo.contador1_inicio)) {
            toast.error('Validação', 'O contador final deve ser maior que o inicial.');
            return;
        }

        try {
            await pcpService.finalizarProducao(registroAtivo.id, {
                contador1_fim: contadores.c1,
                contador2_fim: contadores.c2,
                qtd_realizada: itemAtivo.qtd_misturas_planejadas
            });

            // INTEGRACAO ESTOQUE: Registrar a entrada física do Produto Acabado
            await estoqueService.addProducao({
                produto_acabado_id: itemAtivo.id_produto_acabado,
                quantidade_produzida: itemAtivo.qtd_misturas_planejadas,
                usuario_id: 'Operador Padrão',
                id_registro_pcp: registroAtivo.id // Link para rastreabilidade
            } as any);

            setIsProduzindo(false);
            setRegistroAtivo(null);

            toast.success('Sucesso', 'Produção finalizada e estoque atualizado!');

            // Simulação de envio de notificação (WhatsApp/SMS)
            logger.info("Notificação enviada: Produção finalizada", { produto: itemAtivo.nome_produto_acabado });

            loadData(); // Will return to list view since 'Produzindo' is gone
        } catch (error) {
            logger.error('Erro ao finalizar produção', error);
            toast.error('Erro', 'Falha ao finalizar operação.');
        }
    };

    if (loading) return <LoadingState message="Carregando Painel do Operador..." fullScreen />;

    return (
        <div className="space-y-8 pb-20">
            {/* Seção Produção Atual */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className={`p-1 text-center text-[10px] font-black uppercase tracking-[0.3em] ${isProduzindo ? 'bg-green-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                    {isProduzindo ? 'Produção em Curso' : itemAtivo ? 'Preparando Produção' : 'Aguardando Seleção'}
                </div>

                <div className="p-10 space-y-8">
                    {itemAtivo ? (
                        <>
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl md:text-5xl font-black text-blue-800 tracking-tighter uppercase">{itemAtivo.nome_produto_acabado}</h2>
                                <div className="flex items-center justify-center gap-4 text-slate-400 font-bold uppercase tracking-widest text-xs">
                                    <span className="flex items-center gap-1"><Package size={14} /> {itemAtivo.qtd_misturas_planejadas} Misturas Planejadas</span>
                                    {isProduzindo ? (
                                        <span className="flex items-center gap-1"><User size={14} /> {turnoAtual}</span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <User size={14} />
                                            <select
                                                value={turnoAtual}
                                                onChange={(e) => setTurnoAtual(e.target.value)}
                                                className="bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none text-slate-500 font-bold uppercase text-xs"
                                            >
                                                <option value="1º Turno">1º Turno</option>
                                                <option value="2º Turno">2º Turno</option>
                                                <option value="3º Turno">3º Turno</option>
                                            </select>
                                        </div>
                                    )}
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

                            <div className="pt-4 flex gap-4">
                                {!isProduzindo && (
                                    <button
                                        onClick={handleCancelSelection}
                                        className="py-8 px-6 text-xl font-black bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-2xl transition-all"
                                    >
                                        VOLTAR
                                    </button>
                                )}
                                {isProduzindo ? (
                                    <button
                                        onClick={handleFinalizar}
                                        className="flex-1 py-8 text-xl font-black bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg border-b-4 border-blue-900 active:border-b-0 translate-y-0 active:translate-y-1 transition-all flex items-center justify-center"
                                    >
                                        <Square size={24} className="mr-3" /> FINALIZAR PRODUÇÃO
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleIniciar}
                                        className="flex-1 py-8 text-xl font-black bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg border-b-4 border-green-900 active:border-b-0 translate-y-0 active:translate-y-1 transition-all flex items-center justify-center"
                                    >
                                        <Play size={24} className="mr-3" /> INICIAR PRODUÇÃO
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-800">Selecione uma Ordem de Produção</h3>
                                <p className="text-slate-400 font-medium">Escolha abaixo qual produto será fabricado agora.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                {proximas.length > 0 ? proximas.map((p, i) => (
                                    <div
                                        key={p.id}
                                        onClick={() => handleSelectOrder(p)}
                                        className="bg-slate-50 hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-200 p-6 rounded-2xl cursor-pointer transition-all group group-hover:shadow-md"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-slate-200 group-hover:bg-blue-200 text-slate-600 group-hover:text-blue-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                                                #{i + 1}
                                            </span>
                                            <ArrowDownCircle className="text-slate-300 group-hover:text-blue-400" size={20} />
                                        </div>
                                        <h4 className="text-lg font-black text-slate-700 group-hover:text-blue-800 uppercase mb-1">{p.nome_produto_acabado}</h4>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                            <Package size={14} /> {p.qtd_misturas_planejadas} Misturas
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-2 py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                        <CheckCircle2 size={48} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-slate-400 font-bold">Nenhuma ordem de produção pendente.</p>
                                        <p className="text-xs text-slate-400">Crie uma nova ordem no Planejamento.</p>
                                    </div>
                                )}
                            </div>
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

            {/* Histórico Recente de Produção */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={18} className="text-blue-500" /> Histórico Recente (Hoje)
                    </h3>
                </div>
                <div className="divide-y divide-slate-50">
                    {proximasPoolHistory.length > 0 ? (
                        proximasPoolHistory.map((reg) => (
                            <div key={reg.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                <div>
                                    <div className="font-black text-slate-800 uppercase">{reg.item?.nome_produto_acabado || reg.nome_produto_acabado || 'Produto sem nome'}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        Fim: {reg.data_hora_fim ? new Date(reg.data_hora_fim).toLocaleTimeString() : '-'} • {reg.nome_operador}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-blue-600">+{reg.qtd_realizada} un</div>
                                    <div className="text-[9px] font-black text-green-500 uppercase">Estoque Atualizado</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center text-slate-400 italic text-sm">Nenhum registro finalizado hoje.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PCPProducao;
