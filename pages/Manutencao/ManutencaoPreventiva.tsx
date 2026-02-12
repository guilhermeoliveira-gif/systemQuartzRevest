import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Maquina } from '../../types_manutencao';
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
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'CRITICO' | 'ALERTA' | 'OK'>('ALL');

    useEffect(() => {
        loadMaquinas();
    }, []);

    const loadMaquinas = async () => {
        try {
            setLoading(true);
            const data = await manutencaoService.getMaquinas();
            setMaquinas(data);
        } catch (error) {
            console.error('Erro ao carregar máquinas:', error);
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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="text-blue-600" />
                        Manutenção Preventiva
                    </h1>
                    <p className="text-slate-500 mt-1">Acompanhamento de horímetros e planos de manutenção</p>
                </div>
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
                                <div className="flex justify-between text-sm text-slate-600 mb-1">
                                    <span>Uso Atual</span>
                                    <span className="font-mono font-bold">{maquina.horas_uso_total}h</span>
                                </div>

                                <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`absolute top-0 left-0 h-full transition-all duration-500 ${statusInfo.status === 'CRITICO' ? 'bg-red-500' :
                                                statusInfo.status === 'ALERTA' ? 'bg-orange-500' : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${percentual}%` }}
                                    />
                                </div>

                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Última: {maquina.ultima_manutencao_horas}h</span>
                                    <span>Próxima: {maquina.ultima_manutencao_horas + maquina.intervalo_manutencao_horas}h</span>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex gap-2">
                                    <button
                                        onClick={() => handleGerarOS(maquina)}
                                        className="flex-1 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 text-sm transition-colors"
                                    >
                                        <Plus size={16} />
                                        Gerar OS Manual
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                                        <MoreVertical size={20} />
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
