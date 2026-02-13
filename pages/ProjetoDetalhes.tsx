
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Calendar, User, Clock, CheckCircle2,
    AlertCircle, ListTodo, Plus, Info, LayoutDashboard
} from 'lucide-react';
import { projetosService } from '../services/projetosService';
import { Projeto, TarefaProjeto } from '../types_projetos';
import { useToast } from '../contexts/ToastContext';

const ProjetoDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    const [projeto, setProjeto] = useState<Projeto | null>(null);
    const [tarefas, setTarefas] = useState<TarefaProjeto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadProjeto();
    }, [id]);

    const loadProjeto = async () => {
        try {
            setLoading(true);
            const data = await projetosService.getProjetoById(id!);
            if (!data) {
                toast.error('Não encontrado', 'Projeto não localizado na base de dados.');
                navigate('/projetos/consulta');
                return;
            }
            setProjeto(data);
            const tasks = await projetosService.getTarefasByProjeto(id!);
            setTarefas(tasks);
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Falha ao carregar detalhes do projeto.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-10 text-center font-mono">Carregando detalhes...</div>;
    }

    if (!projeto) return null;

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Breadcrumb approach */}
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => navigate('/projetos/consulta')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">{projeto.nome}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${projeto.prioridade === 'URGENTE' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                            Prioridade {projeto.prioridade}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                            <Info size={20} className="text-teal-600" />
                            Sobre o Projeto
                        </h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            {projeto.descricao || 'Sem descrição detalhada disponível.'}
                        </p>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8 p-6 bg-slate-50 rounded-2xl">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Início</p>
                                <div className="flex items-center gap-2 text-slate-700 font-bold">
                                    <Calendar size={16} />
                                    {new Date(projeto.data_inicio).toLocaleDateString()}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prazo</p>
                                <div className="flex items-center gap-2 text-slate-700 font-bold">
                                    <Clock size={16} />
                                    {new Date(projeto.data_fim_prevista).toLocaleDateString()}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável</p>
                                <div className="flex items-center gap-2 text-slate-700 font-bold truncate">
                                    <User size={16} />
                                    {projeto.responsavel?.nome || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                <div className={`inline-flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest ${projeto.status === 'CONCLUIDO' ? 'text-green-600' : 'text-blue-600'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${projeto.status === 'CONCLUIDO' ? 'bg-green-600' : 'bg-blue-600'}`} />
                                    {projeto.status.replace('_', ' ')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Task List in details page */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <ListTodo size={20} className="text-teal-600" />
                                Tarefas do Projeto
                            </h2>
                            <button
                                onClick={() => navigate('/projetos/tarefas-consulta')}
                                className="text-xs font-black text-teal-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                            >
                                <Plus size={14} /> Adicionar
                            </button>
                        </div>

                        <div className="space-y-3">
                            {tarefas.map(t => (
                                <div key={t.id} className="flex items-center gap-4 p-4 border border-slate-50 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group">
                                    <div className={`w-2 h-2 rounded-full ${t.status === 'CONCLUIDA' ? 'bg-green-500' : 'bg-slate-300'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-slate-700 truncate ${t.status === 'CONCLUIDA' ? 'line-through opacity-50' : ''}`}>
                                            {t.titulo}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.responsavel?.nome}</p>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 group-hover:text-teal-600 transition-colors">
                                        Vence {new Date(t.data_fim_prevista).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                            {tarefas.length === 0 && (
                                <p className="text-center py-8 text-slate-400 font-medium italic">Nenhuma tarefa vinculada a este projeto.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats / Progress */}
                <div className="space-y-6">
                    <div className="bg-teal-900 text-white p-8 rounded-3xl shadow-2xl">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 opacity-60">Progresso Geral</h3>
                        <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="64" cy="64" r="58"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="12"
                                    fill="transparent"
                                />
                                <circle
                                    cx="64" cy="64" r="58"
                                    stroke="white"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={364.4}
                                    strokeDashoffset={364.4 * (1 - projeto.progresso / 100)}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute text-3xl font-black">{projeto.progresso}%</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                <span>Total Tarefas</span>
                                <span>{tarefas.length}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-teal-400">
                                <span>Concluídas</span>
                                <span>{tarefas.filter(t => t.status === 'CONCLUIDA').length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ações do Gestor</h3>
                        <div className="grid grid-cols-1 gap-2">
                            <button className="flex items-center gap-3 p-3 w-full text-left font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><LayoutDashboard size={18} /></div>
                                Gerar Relatório PDF
                            </button>
                            <button className="flex items-center gap-3 p-3 w-full text-left font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><CheckCircle2 size={18} /></div>
                                Marcar como Concluído
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjetoDetalhes;
