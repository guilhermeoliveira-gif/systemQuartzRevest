import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Maquina, MaquinaPlanoVinculo } from '../../types_manutencao';
import { manutencaoService } from '../../services/manutencaoService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Wrench,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Search,
    Filter,
    MoreVertical,
    Plus,
    ArrowRight
} from 'lucide-react';

const ManutencaoPreventiva: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [maquinas, setMaquinas] = useState<(Maquina & { planos?: MaquinaPlanoVinculo[] })[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'CRITICO' | 'ALERTA' | 'OK'>('ALL');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const maquinasData = await manutencaoService.getMaquinas();

            // Carregar planos para cada máquina
            const maquinasComPlanos = await Promise.all(maquinasData.map(async (m) => {
                const planos = await manutencaoService.getPlanosByMaquina(m.id);
                return { ...m, planos };
            }));

            setMaquinas(maquinasComPlanos);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            showToast('Erro ao carregar dados de manutenção.', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusPreventiva = (maquina: Maquina) => {
        const horasRestantes = (maquina.ultima_manutencao_horas + maquina.intervalo_manutencao_horas) - maquina.horas_uso_total;
        if (horasRestantes <= 0) return { status: 'CRITICO', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Vencida' };
        if (horasRestantes <= maquina.intervalo_manutencao_horas * 0.1) return { status: 'ALERTA', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Próxima' };
        return { status: 'OK', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Em dia' };
    };

    const handleGerarOSDePlano = async (maquina: Maquina, vinculo: MaquinaPlanoVinculo) => {
        try {
            if (!confirm(`Abrir Ordem de Serviço para o plano "${vinculo.plano?.nome}" na máquina ${maquina.nome}?`)) return;

            // Buscar itens do plano para colocar na descrição
            const planos = await manutencaoService.getPlanos();
            const planoCompleto = planos.find(p => p.id === vinculo.plano_id);
            const checklistTxt = planoCompleto?.itens.map(i => `- [ ] ${i.tarefa}`).join('\n') || '';

            await manutencaoService.createOS({
                maquina_id: maquina.id,
                tipo: 'Preventiva',
                tipo_os: 'Manutencao Preventiva',
                status: 'Aberta',
                prioridade: 'Alta',
                descricao: `PLANO: ${vinculo.plano?.nome}\n\nRoteiro:\n${checklistTxt}`,
                data_abertura: new Date().toISOString(),
                custo_total: 0,
                pecas_utilizadas: []
            });

            showToast('OS do Plano gerada com sucesso!', { type: 'success' });
        } catch (error) {
            console.error(error);
            showToast('Erro ao gerar OS do plano.', { type: 'error' });
        }
    };

    const handleGerarOS = async (maquina: Maquina) => {
        try {
            if (!confirm(`Gerar OS de Manutenção Preventiva para ${maquina.nome}?`)) return;

            await manutencaoService.createOS({
                maquina_id: maquina.id,
                tipo: 'Preventiva',
                tipo_os: 'Manutencao Preventiva',
                status: 'Aberta',
                prioridade: 'Alta',
                descricao: `Manutenção Preventiva Manual - Horímetro: ${maquina.horas_uso_total}h`,
                data_abertura: new Date().toISOString(),
                custo_total: 0,
                pecas_utilizadas: []
            });

            showToast('OS de Manutenção Preventiva gerada com sucesso!', { type: 'success' });
            // Redirecionar ou atualizar
        } catch (error) {
            console.error('Erro ao gerar OS:', error);
            showToast('Erro ao gerar Ordem de Serviço.', { type: 'error' });
        }
    };

    const filteredMaquinas = maquinas.filter(m => {
        const status = getStatusPreventiva(m);
        const matchesSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

        if (filterStatus === 'ALL') return matchesSearch;
        return matchesSearch && status.status === filterStatus;
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="text-blue-600" />
                        Manutenção Preventiva
                    </h1>
                    <p className="text-slate-500 mt-1">Acompanhamento de horímetros e planos de manutenção</p>
                </div>
                <Link to="/manutencao/planos" className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors border border-slate-200 shadow-sm">
                    <Wrench size={18} className="text-slate-400" /> Configurar Planos
                </Link>
            </div>

            {/* Filtros e Busca */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou modelo..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    {['ALL', 'CRITICO', 'ALERTA', 'OK'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {status === 'ALL' ? 'Todos' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de Máquinas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaquinas.map(maquina => {
                    const statusInfo = getStatusPreventiva(maquina);
                    const percentual = Math.min(100, Math.max(0, ((maquina.horas_uso_total - maquina.ultima_manutencao_horas) / maquina.intervalo_manutencao_horas) * 100));

                    return (
                        <div key={maquina.id} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${statusInfo.border}`}>
                            <div className={`p-4 border-b ${statusInfo.bg} flex justify-between items-center`}>
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-full bg-white ${statusInfo.color}`}>
                                        <Wrench size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{maquina.nome}</h3>
                                        <p className="text-xs text-slate-500">{maquina.modelo || 'Sem modelo'}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold bg-white ${statusInfo.color} border border-current`}>
                                    {statusInfo.label}
                                </span>
                            </div>

                            <div className="p-4 space-y-4">
                                {maquina.planos && maquina.planos.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planos Ativos</h4>
                                        {maquina.planos.map(v => (
                                            <div key={v.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center group">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700">{v.plano?.nome}</span>
                                                    <span className="text-[10px] text-slate-400 italic">Vencimento: {v.status_vencimento}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleGerarOSDePlano(maquina, v)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Abrir OS deste Plano"
                                                >
                                                    <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-2">
                                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                                        <span>Horímetro Geral</span>
                                        <span className="font-mono font-bold">{maquina.horas_uso_total}h</span>
                                    </div>

                                    <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`absolute top-0 left-0 h-full transition-all duration-500 ${statusInfo.status === 'CRITICO' ? 'bg-red-500' :
                                                statusInfo.status === 'ALERTA' ? 'bg-orange-500' : 'bg-blue-500'
                                                }`}
                                            style={{ width: `${percentual}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex gap-2">
                                    <button
                                        onClick={() => handleGerarOS(maquina)}
                                        className="flex-1 py-1.5 bg-slate-50 text-slate-600 font-bold rounded-lg hover:bg-slate-100 flex items-center justify-center gap-2 text-xs transition-colors"
                                    >
                                        <Plus size={14} />
                                        Geração Manual
                                    </button>
                                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredMaquinas.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <Wrench size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Nenhuma máquina encontrada com os filtros atuais.</p>
                </div>
            )}
        </div>
    );
};

export default ManutencaoPreventiva;
