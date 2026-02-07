import React, { useState, useEffect } from 'react';
import { qualidadeService } from '../services/qualidadeService';
import { Tarefa } from '../types_plano_acao';
import { CheckCircle, Clock, AlertCircle, FileText, User } from 'lucide-react';

interface TarefaComPlano extends Tarefa {
    plano_acao?: {
        titulo: string;
    };
}

const MinhasTarefas: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [tarefas, setTarefas] = useState<TarefaComPlano[]>([]);
    const [filtroResponsavel, setFiltroResponsavel] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('TODOS');

    useEffect(() => {
        fetchTarefas();
    }, []);

    const fetchTarefas = async () => {
        try {
            setLoading(true);
            const data = await qualidadeService.getTodasTarefas();
            setTarefas(data as unknown as TarefaComPlano[]);
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
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'CONCLUIDA': return <CheckCircle size={16} />;
            case 'EM_ANDAMENTO': return <Clock size={16} />;
            case 'PENDENTE': return <AlertCircle size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const formatarData = (data: string) => {
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
    };

    const tarefasFiltradas = tarefas.filter(tarefa => {
        const matchResponsavel = filtroResponsavel
            ? tarefa.responsavel.toLowerCase().includes(filtroResponsavel.toLowerCase())
            : true;
        const matchStatus = filtroStatus !== 'TODOS' ? tarefa.status === filtroStatus : true;
        return matchResponsavel && matchStatus;
    });

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <header>
                <h1 className="text-3xl font-bold text-neutral-900">Minhas Tarefas</h1>
                <p className="text-neutral-500">Acompanhe e gerencie as tarefas atribuídas a você.</p>
            </header>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Filtrar por Responsável</label>
                    <div className="relative">
                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Digite o nome..."
                            value={filtroResponsavel}
                            onChange={(e) => setFiltroResponsavel(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="w-full md:w-48">
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Status</label>
                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="TODOS">Todos</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="EM_ANDAMENTO">Em Andamento</option>
                        <option value="CONCLUIDA">Concluída</option>
                    </select>
                </div>
            </div>

            {/* Lista de Tarefas */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-slate-400">Carregando tarefas...</div>
                ) : tarefasFiltradas.length > 0 ? (
                    tarefasFiltradas.map((tarefa) => (
                        <div
                            key={tarefa.id}
                            className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden"
                        >
                            {/* Barra lateral colorida baseada no status */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${tarefa.status === 'CONCLUIDA' ? 'bg-green-500' :
                                    tarefa.status === 'EM_ANDAMENTO' ? 'bg-blue-500' : 'bg-orange-500'
                                }`} />

                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(tarefa.status)}`}>
                                        {getStatusIcon(tarefa.status)}
                                        {tarefa.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                        <Clock size={12} />
                                        Prazo: {formatarData(tarefa.prazo)}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800">{tarefa.descricao}</h3>

                                {tarefa.plano_acao?.titulo && (
                                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                                        <FileText size={14} />
                                        <span className="font-medium">Plano:</span> {tarefa.plano_acao.titulo}
                                    </div>
                                )}

                                {tarefa.observacoes && (
                                    <p className="text-sm text-slate-600 mt-2 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                        <span className="font-bold text-yellow-700 block text-xs mb-1 uppercase">Observações</span>
                                        {tarefa.observacoes}
                                    </p>
                                )}
                            </div>

                            <div className="md:w-48 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 gap-4">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Responsável</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                                            {tarefa.responsavel.substring(0, 2)}
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 truncate">{tarefa.responsavel}</span>
                                    </div>
                                </div>

                                {tarefa.status !== 'CONCLUIDA' && (
                                    <button className="w-full py-2 px-4 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors">
                                        Ver Detalhes
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-slate-50 rounded-xl p-10 text-center border-2 border-dashed border-slate-200">
                        <h3 className="text-lg font-bold text-slate-600 mb-2">Nenhuma tarefa encontrada</h3>
                        <p className="text-slate-400 text-sm">Tente ajustar os filtros ou adicione tarefas aos planos de ação.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MinhasTarefas;
