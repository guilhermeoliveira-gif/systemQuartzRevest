import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificacoesService } from '../services/notificacoesService';
import { TarefaUnificada } from '../types_notificacoes';
import { CheckCircle, Clock, AlertCircle, FileText, User, Filter, FolderKanban, ClipboardList } from 'lucide-react';

const MinhasTarefas: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tarefas, setTarefas] = useState<TarefaUnificada[]>([]);
    const [filtroOrigem, setFiltroOrigem] = useState<string>('TODAS');
    const [filtroStatus, setFiltroStatus] = useState('TODOS');
    const [filtroPrioridade, setFiltroPrioridade] = useState('TODAS');

    useEffect(() => {
        fetchTarefas();
    }, []);

    const fetchTarefas = async () => {
        try {
            setLoading(true);
            const data = await notificacoesService.getMinhasTarefas();
            setTarefas(data);
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONCLUIDA': return 'bg-green-100 text-green-800 border-green-200';
            case 'EM_ANDAMENTO': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'PENDENTE': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'BLOQUEADA': return 'bg-red-100 text-red-800 border-red-200';
            case 'CANCELADA': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'CONCLUIDA': return <CheckCircle size={16} />;
            case 'EM_ANDAMENTO': return <Clock size={16} />;
            case 'PENDENTE': return <AlertCircle size={16} />;
            case 'BLOQUEADA': return <AlertCircle size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const getPrioridadeColor = (prioridade: string) => {
        switch (prioridade) {
            case 'URGENTE': return 'bg-red-500 text-white';
            case 'ALTA': return 'bg-orange-500 text-white';
            case 'MEDIA': return 'bg-blue-500 text-white';
            case 'BAIXA': return 'bg-slate-400 text-white';
            default: return 'bg-slate-400 text-white';
        }
    };

    const getOrigemIcon = (origem: string) => {
        switch (origem) {
            case 'PROJETO': return <FolderKanban size={14} className="text-teal-600" />;
            case 'PLANO_ACAO': return <ClipboardList size={14} className="text-red-600" />;
            default: return <FileText size={14} />;
        }
    };

    const getOrigemLabel = (origem: string) => {
        switch (origem) {
            case 'PROJETO': return 'Projeto';
            case 'PLANO_ACAO': return 'Qualidade';
            default: return origem;
        }
    };

    const formatarData = (data: string) => {
        if (!data) return '-';
        const date = new Date(data);
        const hoje = new Date();
        const diff = Math.ceil((date.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diff < 0) return `${Math.abs(diff)}d atrasado`;
        if (diff === 0) return 'Hoje';
        if (diff === 1) return 'Amanhã';
        return `${diff}d restantes`;
    };

    const isAtrasada = (prazo: string, status: string) => {
        if (status === 'CONCLUIDA' || status === 'CANCELADA') return false;
        return new Date(prazo) < new Date();
    };

    const tarefasFiltradas = tarefas.filter(tarefa => {
        const matchOrigem = filtroOrigem !== 'TODAS' ? tarefa.origem === filtroOrigem : true;
        const matchStatus = filtroStatus !== 'TODOS' ? tarefa.status === filtroStatus : true;
        const matchPrioridade = filtroPrioridade !== 'TODAS' ? tarefa.prioridade === filtroPrioridade : true;
        return matchOrigem && matchStatus && matchPrioridade;
    });

    const tarefasPendentes = tarefas.filter(t => t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA');
    const tarefasAtrasadas = tarefasPendentes.filter(t => isAtrasada(t.prazo, t.status));
    const tarefasHoje = tarefasPendentes.filter(t => {
        const diff = Math.ceil((new Date(t.prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return diff === 0;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            <header className="px-1">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Minhas Tarefas</h1>
                <p className="text-slate-500 font-medium text-sm">Todas as suas pendências unificadas</p>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
                <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="text-blue-600" size={18} />
                        </div>
                        <p className="text-2xl font-black text-slate-800 leading-none">{tarefasPendentes.length}</p>
                    </div>
                    <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Pendentes</p>
                </div>

                <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="text-red-600" size={18} />
                        </div>
                        <p className="text-2xl font-black text-red-600 leading-none">{tarefasAtrasadas.length}</p>
                    </div>
                    <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Atrasadas</p>
                </div>

                <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Clock className="text-orange-600" size={18} />
                        </div>
                        <p className="text-2xl font-black text-orange-600 leading-none">{tarefasHoje.length}</p>
                    </div>
                    <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Hoje</p>
                </div>

                <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={18} />
                        </div>
                        <p className="text-2xl font-black text-green-600 leading-none">
                            {tarefas.filter(t => t.status === 'CONCLUIDA').length}
                        </p>
                    </div>
                    <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Concluídas</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={18} className="text-slate-600" />
                    <h3 className="font-bold text-slate-800">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Origem</label>
                        <select
                            value={filtroOrigem}
                            onChange={(e) => setFiltroOrigem(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="TODAS">Todas</option>
                            <option value="PROJETO">Projetos</option>
                            <option value="PLANO_ACAO">Qualidade</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Status</label>
                        <select
                            value={filtroStatus}
                            onChange={(e) => setFiltroStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="TODOS">Todos</option>
                            <option value="PENDENTE">Pendente</option>
                            <option value="EM_ANDAMENTO">Em Andamento</option>
                            <option value="BLOQUEADA">Bloqueada</option>
                            <option value="CONCLUIDA">Concluída</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Prioridade</label>
                        <select
                            value={filtroPrioridade}
                            onChange={(e) => setFiltroPrioridade(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="TODAS">Todas</option>
                            <option value="URGENTE">Urgente</option>
                            <option value="ALTA">Alta</option>
                            <option value="MEDIA">Média</option>
                            <option value="BAIXA">Baixa</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de Tarefas */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-10 text-slate-400">
                        <Clock size={48} className="mx-auto mb-2 animate-spin" />
                        <p>Carregando tarefas...</p>
                    </div>
                ) : tarefasFiltradas.length > 0 ? (
                    tarefasFiltradas.map((tarefa) => (
                        <div
                            key={tarefa.id}
                            onClick={() => navigate(tarefa.link)}
                            className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer ${isAtrasada(tarefa.prazo, tarefa.status) ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(tarefa.status)}`}>
                                            {getStatusIcon(tarefa.status)}
                                            {tarefa.status.replace('_', ' ')}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getPrioridadeColor(tarefa.prioridade)}`}>
                                            {tarefa.prioridade}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 flex items-center gap-1">
                                            {getOrigemIcon(tarefa.origem)}
                                            {getOrigemLabel(tarefa.origem)}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800">{tarefa.titulo}</h3>

                                    {tarefa.descricao && (
                                        <p className="text-sm text-slate-600 line-clamp-2">{tarefa.descricao}</p>
                                    )}

                                    {tarefa.contexto && (
                                        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                                            <FileText size={14} />
                                            <span className="font-medium">{tarefa.contexto}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col justify-between items-end gap-2 min-w-[140px]">
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Prazo</p>
                                        <p className={`text-sm font-bold ${isAtrasada(tarefa.prazo, tarefa.status) ? 'text-red-600' : 'text-slate-700'
                                            }`}>
                                            {new Date(tarefa.prazo).toLocaleDateString('pt-BR')}
                                        </p>
                                        <p className="text-xs text-slate-500">{formatarData(tarefa.prazo)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-slate-50 rounded-xl p-10 text-center border-2 border-dashed border-slate-200">
                        <CheckCircle size={48} className="mx-auto mb-2 text-slate-300" />
                        <h3 className="text-lg font-bold text-slate-600 mb-2">Nenhuma tarefa encontrada</h3>
                        <p className="text-slate-400 text-sm">Tente ajustar os filtros ou você está em dia com suas tarefas! 🎉</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MinhasTarefas;
