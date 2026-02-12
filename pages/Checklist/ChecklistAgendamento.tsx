import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { checklistService } from '../../services/checklistService';
import { manutencaoService } from '../../services/manutencaoService';
import { ChecklistModelo, ChecklistAgendamento as IChecklistAgendamento, TipoEntidade } from '../../types_checklist';
import { Maquina } from '../../types_manutencao';
import {
    Calendar, User, Save, List, Plus, Search, Filter,
    CheckCircle2, Clock, AlertTriangle, XCircle, MoreVertical,
    LayoutGrid, List as ListIcon, CalendarDays, Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChecklistAgendamento: React.FC = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Data State
    const [modelos, setModelos] = useState<ChecklistModelo[]>([]);
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [agendamentos, setAgendamentos] = useState<IChecklistAgendamento[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);

    // Form State
    const [novoAgendamento, setNovoAgendamento] = useState({
        modelo_id: '',
        data_agendada: new Date().toISOString().split('T')[0],
        responsavel_id: '',
        entidade_id: '',
        tipo_entidade: 'MAQUINA' as TipoEntidade
    });

    useEffect(() => {
        loadDados();
    }, []);

    const loadDados = async () => {
        try {
            setLoading(true);
            const [modelosData, maquinasData, agendamentosData] = await Promise.all([
                checklistService.getModelos(),
                manutencaoService.getMaquinas(),
                checklistService.getAgendamentos()
            ]);
            setModelos(modelosData);
            setMaquinas(maquinasData);
            setAgendamentos(agendamentosData);
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar dados', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAgendar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Mock de User ID logado como responsável se vazio
            // TODO: Integrar com contexto de autenticação real
            const user_id = 'c13327d0-7d72-4632-841d-384196165243';

            await checklistService.createAgendamento({
                modelo_id: novoAgendamento.modelo_id,
                data_agendada: novoAgendamento.data_agendada,
                responsavel_id: user_id,
                entidade_id: novoAgendamento.entidade_id,
                tipo_entidade: novoAgendamento.tipo_entidade,
                status: 'PENDENTE'
            });

            showToast('Agendamento criado com sucesso!', { type: 'success' });
            loadDados();
            setIsNewModalOpen(false);
            setNovoAgendamento({
                modelo_id: '',
                data_agendada: new Date().toISOString().split('T')[0],
                responsavel_id: '',
                entidade_id: '',
                tipo_entidade: 'MAQUINA'
            });
        } catch (error) {
            console.error(error);
            showToast('Erro ao agendar checklist', { type: 'error' });
        }
    };

    // Derived State for KPIs
    const kpis = {
        total: agendamentos.length,
        pendentes: agendamentos.filter(a => a.status === 'PENDENTE').length,
        concluidos: agendamentos.filter(a => a.status === 'CONCLUIDO').length,
        atrasados: agendamentos.filter(a => {
            const dataAgendada = new Date(a.data_agendada);
            const hoje = new Date();
            return a.status === 'PENDENTE' && dataAgendada < hoje;
        }).length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                    <p className="text-slate-500 font-medium">Carregando checklist...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Area */}
            <div className="bg-white border-b border-slate-200 px-6 py-6 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                <CheckCircle2 className="text-blue-600" size={28} />
                                Controle de Inspeções
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">Gerencie agendamentos e execuções de checklist</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsNewModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus size={20} />
                                Novo Agendamento
                            </button>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between h-24">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-slate-800">{kpis.total}</span>
                                <ListIcon className="text-slate-300 mb-1" size={20} />
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex flex-col justify-between h-24">
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pendentes</span>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-amber-900">{kpis.pendentes}</span>
                                <Clock className="text-amber-300 mb-1" size={20} />
                            </div>
                        </div>
                        <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex flex-col justify-between h-24">
                            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Concluídos</span>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-green-900">{kpis.concluidos}</span>
                                <CheckCircle2 className="text-green-300 mb-1" size={20} />
                            </div>
                        </div>
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex flex-col justify-between h-24">
                            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Atrasados</span>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-red-900">{kpis.atrasados}</span>
                                <AlertTriangle className="text-red-300 mb-1" size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Config & Filters Toolbar */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            placeholder="Buscar inspeção..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setViewMode('CARDS')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'CARDS' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('TABLE')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'TABLE' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ListIcon size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                {viewMode === 'CARDS' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agendamentos.map(ag => (
                            <div
                                key={ag.id}
                                onClick={() => navigate(`/checklist/execucao/${ag.id}`)}
                                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <CalendarDays size={24} />
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${ag.status === 'CONCLUIDO' ? 'bg-green-100 text-green-700' :
                                            ag.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {ag.status}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">{ag.modelo?.nome || 'Checklist Geral'}</h3>
                                <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                                    <Truck size={14} />
                                    <span>{maquinas.find(m => m.id === ag.entidade_id)?.nome || 'Equipamento não identificado'}</span>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400 font-medium">Data Prevista</span>
                                        <span className="font-bold text-slate-700">{new Date(ag.data_agendada).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400 font-medium">Responsável</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                U
                                            </div>
                                            <span className="font-medium text-slate-700 truncate max-w-[100px]">
                                                {ag.responsavel?.nome || 'Designado'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Modelo</th>
                                    <th className="p-4">Entidade / Veículo</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Responsável</th>
                                    <th className="p-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {agendamentos.map(ag => (
                                    <tr key={ag.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-700">
                                            {new Date(ag.data_agendada).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 font-medium text-slate-800">{ag.modelo?.nome}</td>
                                        <td className="p-4 text-slate-500 text-sm">
                                            {maquinas.find(m => m.id === ag.entidade_id)?.nome || '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${ag.status === 'CONCLUIDO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {ag.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">{ag.responsavel?.nome || 'Admin'}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => navigate(`/checklist/execucao/${ag.id}`)}
                                                className="text-blue-600 hover:text-blue-800 font-bold text-sm"
                                            >
                                                Abrir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Novo Agendamento */}
            {isNewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-black tracking-tight">Novo Agendamento</h2>
                            <button
                                onClick={() => setIsNewModalOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-xl transition"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAgendar} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Modelo de Checklist</label>
                                <select
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                    value={novoAgendamento.modelo_id}
                                    onChange={e => setNovoAgendamento({ ...novoAgendamento, modelo_id: e.target.value })}
                                >
                                    <option value="">Selecione um modelo...</option>
                                    {modelos.map(m => (
                                        <option key={m.id} value={m.id}>{m.nome} ({m.area})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Veículo / Máquina</label>
                                <select
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                    value={novoAgendamento.entidade_id}
                                    onChange={e => setNovoAgendamento({ ...novoAgendamento, entidade_id: e.target.value })}
                                >
                                    <option value="">Selecione o equipamento...</option>
                                    {maquinas.map(m => (
                                        <option key={m.id} value={m.id}>{m.nome} - {m.modelo}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Prevista</label>
                                <input
                                    type="date"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                    value={novoAgendamento.data_agendada}
                                    onChange={e => setNovoAgendamento({ ...novoAgendamento, data_agendada: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 mt-4"
                            >
                                <Save size={20} />
                                Confirmar Agendamento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChecklistAgendamento;
