import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projetosService } from '../services/projetosService';
import { Projeto } from '../types_projetos';

const ProjetosDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [projetosData, statsData] = await Promise.all([
                projetosService.getProjetos(),
                projetosService.getEstatisticas()
            ]);
            setProjetos(projetosData);
            setStats(statsData);
        } catch (error: any) {
            console.error('Erro ao carregar dados:', error);
            setError(error.message || 'Erro ao carregar dados. Verifique se as tabelas foram criadas no Supabase.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h2 className="text-red-800 font-bold text-lg mb-2">⚠️ Erro ao Carregar Dados</h2>
                <p className="text-red-700 mb-4">{error}</p>
                <p className="text-sm text-red-600">
                    <strong>Solução:</strong> Execute o script <code className="bg-red-100 px-2 py-1 rounded">supabase_schema_projetos.sql</code> no Supabase SQL Editor.
                </p>
                <button
                    onClick={loadData}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    const projetosAtivos = projetos.filter(p => p.status === 'EM_ANDAMENTO');
    const projetosConcluidos = projetos.filter(p => p.status === 'CONCLUIDO');
    const projetosAtrasados = projetos.filter(p =>
        p.status === 'EM_ANDAMENTO' && new Date(p.data_fim_prevista) < new Date()
    );

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FolderKanban className="text-teal-600" />
                        Dashboard de Projetos
                    </h1>
                    <p className="text-slate-500">Visão geral dos projetos em andamento</p>
                </div>
                <button
                    onClick={() => navigate('/projetos/consulta')}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 transition shadow-sm font-medium"
                >
                    <Plus size={20} />
                    Novo Projeto
                </button>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-600 text-sm font-medium">Total de Projetos</span>
                        <FolderKanban className="text-teal-600" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{projetos.length}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-600 text-sm font-medium">Em Andamento</span>
                        <TrendingUp className="text-blue-600" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{projetosAtivos.length}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-600 text-sm font-medium">Concluídos</span>
                        <CheckCircle2 className="text-green-600" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{projetosConcluidos.length}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-600 text-sm font-medium">Atrasados</span>
                        <AlertCircle className="text-red-600" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{projetosAtrasados.length}</p>
                </div>
            </div>

            {/* Lista de Projetos */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800">Projetos Recentes</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {projetos.slice(0, 10).map(projeto => (
                        <div
                            key={projeto.id}
                            onClick={() => navigate(`/projetos/detalhes/${projeto.id}`)}
                            className="p-5 hover:bg-slate-50 cursor-pointer transition"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800 mb-1">{projeto.nome}</h3>
                                    <p className="text-sm text-slate-600">{projeto.descricao}</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${projeto.status === 'CONCLUIDO' ? 'bg-green-100 text-green-700' :
                                        projeto.status === 'EM_ANDAMENTO' ? 'bg-blue-100 text-blue-700' :
                                            projeto.status === 'PAUSADO' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-slate-100 text-slate-700'
                                        }`}>
                                        {projeto.status.replace('_', ' ')}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${projeto.prioridade === 'URGENTE' ? 'bg-red-100 text-red-700' :
                                        projeto.prioridade === 'ALTA' ? 'bg-orange-100 text-orange-700' :
                                            projeto.prioridade === 'MEDIA' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-700'
                                        }`}>
                                        {projeto.prioridade}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    <span>Prazo: {new Date(projeto.data_fim_prevista).toLocaleDateString()}</span>
                                </div>
                                {projeto.responsavel && (
                                    <div>
                                        <span className="font-medium">{projeto.responsavel.nome}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">Progresso</span>
                                    <span className="font-bold text-teal-600">{projeto.progresso}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                        className="bg-teal-600 h-2 rounded-full transition-all"
                                        style={{ width: `${projeto.progresso}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjetosDashboard;
