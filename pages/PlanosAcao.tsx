
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ClipboardCheck, Plus, Search, Calendar, User,
    MapPin, HelpCircle, DollarSign, Wrench, Activity,
    CheckCircle, XCircle, Save, ArrowLeft, Filter, Trash2, CheckSquare, ListCheck, CheckCircle2
} from 'lucide-react';
import { PlanoAcao, Tarefa } from '../types_plano_acao';
import { qualidadeService } from '../services/qualidadeService';
import { manutencaoService } from '../services/manutencaoService';
import { Maquina } from '../types_manutencao';
import OSModal from '../components/Manutencao/OSModal';
import { Settings as MachineIcon } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const PlanosAcao: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const searchParams = new URLSearchParams(location.search);
    const ncIdParam = searchParams.get('nc_id');
    const ncTitleParam = searchParams.get('nc_title');

    // State
    const [planos, setPlanos] = useState<PlanoAcao[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'STANDALONE'>('LIST');
    const [currentTasks, setCurrentTasks] = useState<Tarefa[]>([]);
    const [selectedPlanoId, setSelectedPlanoId] = useState<string | null>(null);
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [isOSModalOpen, setIsOSModalOpen] = useState(false);
    const [taskParaOS, setTaskParaOS] = useState<Tarefa | null>(null);

    // Standalone Tasks State (kept for backward compatibility)
    const [standaloneTasks, setStandaloneTasks] = useState<Tarefa[]>([]);

    // Task Input State
    const [newTask, setNewTask] = useState<Partial<Tarefa>>({
        descricao: '',
        responsavel: '',
        prazo: '',
        maquina_id: ''
    });

    const mockUsers = ['João Silva', 'Maria Oliveira', 'Carlos Supervisor', 'Ana RH', 'Pedro Engenheiro'];

    // Form State
    const [formData, setFormData] = useState<Partial<PlanoAcao>>({
        status_acao: 'PENDENTE',
        how_much: '0,00'
    });

    const loadPlanosAcao = async () => {
        try {
            setLoading(true);
            const [data, maquinasData] = await Promise.all([
                qualidadeService.getPlanosAcao(),
                manutencaoService.getMaquinas()
            ]);
            setMaquinas(maquinasData);

            // Load tasks for each plano
            const planosWithTasks = await Promise.all(
                data.map(async (plano) => {
                    const tarefas = await qualidadeService.getTarefasByPlano(plano.id);
                    return { ...plano, tarefas };
                })
            );

            setPlanos(planosWithTasks);
        } catch (error) {
            console.error('Erro ao carregar planos de ação:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load data from Supabase on mount
    useEffect(() => {
        loadPlanosAcao();
    }, []);

    // Effect to handle incoming NC redirection
    useEffect(() => {
        if (ncIdParam) {
            setFormData({
                nao_conformidade_id: ncIdParam,
                titulo: ncTitleParam ? `Ação Corretiva: ${ncTitleParam}` : '',
                what: ncTitleParam ? `Correção para: ${ncTitleParam}` : '',
                status_acao: 'PENDENTE',
                how_much: '0,00',
                when_date: new Date().toISOString().split('T')[0],
                where_loc: '',
                who: '',
                why: '',
                how: ''
            });
            setViewMode('FORM');
        }
    }, [ncIdParam, ncTitleParam]);

    const handleAddStandaloneTask = async () => {
        if (!newTask.descricao || !newTask.responsavel || !selectedPlanoId) return;

        try {
            const task: Omit<Tarefa, 'id' | 'created_at'> = {
                plano_acao_id: selectedPlanoId,
                descricao: newTask.descricao,
                responsavel: newTask.responsavel,
                prazo: newTask.prazo || new Date().toISOString(),
                status: 'PENDENTE',
                observacoes: '',
                maquina_id: newTask.maquina_id
            };

            await qualidadeService.createTarefa(task);
            toast.success('Tarefa Adicionada', 'A tarefa foi vinculada ao plano de ação.');
            await loadPlanosAcao();

            setNewTask({ descricao: '', responsavel: '', prazo: '', maquina_id: '' });
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
            alert('Erro ao adicionar tarefa. Tente novamente.');
        }
    };

    const toggleStandaloneTask = async (id: string) => {
        try {
            const task = standaloneTasks.find(t => t.id === id);
            if (!task) return;

            const newStatus = task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
            await qualidadeService.updateTarefa(id, { status: newStatus });
            await loadPlanosAcao();
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
        }
    };

    const deleteStandaloneTask = async (id: string) => {
        try {
            await qualidadeService.deleteTarefa(id);
            await loadPlanosAcao();
        } catch (error) {
            console.error('Erro ao deletar tarefa:', error);
        }
    };

    const handleSavePlano = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const plano: Omit<PlanoAcao, 'id' | 'created_at'> = {
                nao_conformidade_id: formData.nao_conformidade_id,
                titulo: formData.titulo || '',
                what: formData.what || '',
                why: formData.why || '',
                where_loc: formData.where_loc || '',
                when_date: formData.when_date || new Date().toISOString(),
                who: formData.who || '',
                how: formData.how || '',
                how_much: formData.how_much,
                status_acao: formData.status_acao || 'PENDENTE'
            };

            const createdPlano = await qualidadeService.createPlanoAcao(plano);

            // Save tasks if any
            if (currentTasks.length > 0) {
                await Promise.all(
                    currentTasks.map(task =>
                        qualidadeService.createTarefa({
                            plano_acao_id: createdPlano.id,
                            descricao: task.descricao,
                            responsavel: task.responsavel,
                            prazo: task.prazo,
                            status: task.status,
                            observacoes: task.observacoes,
                            maquina_id: task.maquina_id
                        })
                    )
                );
            }

            await loadPlanosAcao();
            setViewMode('LIST');
            setFormData({ status_acao: 'PENDENTE', how_much: '0,00' });
            setCurrentTasks([]);
        } catch (error) {
            console.error('Erro ao salvar plano de ação:', error);
            alert('Erro ao salvar plano de ação. Tente novamente.');
        }
    };

    const handleAddTask = () => {
        if (!newTask.descricao || !newTask.responsavel) return;

        const task: Tarefa = {
            id: Math.random().toString(36).substr(2, 9),
            plano_acao_id: selectedPlanoId || '',
            descricao: newTask.descricao,
            responsavel: newTask.responsavel,
            prazo: newTask.prazo || new Date().toISOString(),
            status: 'PENDENTE',
            observacoes: '',
            maquina_id: newTask.maquina_id,
            created_at: new Date().toISOString()
        };

        setCurrentTasks([...currentTasks, task]);
        setNewTask({ descricao: '', responsavel: '', prazo: '', maquina_id: '' });
    };

    const handleDeleteTask = (id: string) => {
        setCurrentTasks(currentTasks.filter(t => t.id !== id));
    };

    const toggleTaskStatus = async (task: Tarefa) => {
        if (task.status === 'CONCLUIDA') {
            await qualidadeService.updateTarefa(task.id, { status: 'PENDENTE' });
            await loadPlanosAcao();
            return;
        }

        if (task.maquina_id) {
            setTaskParaOS(task);
            setIsOSModalOpen(true);
        } else {
            await qualidadeService.updateTarefa(task.id, { status: 'CONCLUIDA' });
            toast.success('Tarefa Concluída', 'O status foi atualizado.');
            await loadPlanosAcao();
        }
    };

    const handleOSSuccess = async (osId: string) => {
        if (taskParaOS) {
            await qualidadeService.updateTarefa(taskParaOS.id, {
                status: 'CONCLUIDA',
                os_id: osId
            });
            await loadPlanosAcao();
            setIsOSModalOpen(false);
            setTaskParaOS(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Carregando planos de ação...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ClipboardCheck className="text-blue-600" />
                        Planos de Ação (5W2H)
                    </h1>
                    <p className="text-slate-500">Gestão de tarefas e correções utilizando metodologia 5W2H</p>
                </div>
            </header>

            {viewMode === 'LIST' ? (
                <>
                    {/* Controls */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Buscar plano de ação..."
                            />
                        </div>
                        <button
                            onClick={() => {
                                setFormData({ status_acao: 'PENDENTE', how_much: '0,00' });
                                setCurrentTasks([]);
                                setViewMode('FORM');
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm font-medium"
                        >
                            <Plus size={20} />
                            Novo Plano Avulso
                        </button>
                    </div>


                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={() => setViewMode('STANDALONE')}
                            className="flex-1 bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition flex items-center gap-3 text-slate-700 font-bold"
                        >
                            <ListCheck className="text-purple-600" />
                            Tarefas Avulsas (Sem Plano)
                        </button>
                        <button className="flex-1 bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition flex items-center gap-3 text-slate-700 font-bold">
                            <CheckSquare className="text-green-600" />
                            Minhas Tarefas Pendentes
                        </button>
                    </div>

                    {/* List */}
                    <div className="grid gap-4">
                        {planos.map(plano => (
                            <div key={plano.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {plano.nao_conformidade_id && (
                                                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-bold border border-red-200">
                                                    RNC
                                                </span>
                                            )}
                                            <span className="text-slate-400 text-xs font-mono">#{plano.id.substring(0, 6).toUpperCase()}</span>
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-800">{plano.titulo}</h3>
                                        {plano.tarefas && plano.tarefas.length > 0 && (
                                            <div className="mt-2 text-xs font-medium text-slate-500 flex items-center gap-2">
                                                <ListCheck size={14} />
                                                <span>
                                                    {plano.tarefas.filter(t => t.status === 'CONCLUIDA').length}/{plano.tarefas.length} Tarefas concluídas
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${plano.status_acao === 'CONCLUIDA' ? 'bg-green-100 text-green-700 border-green-200' :
                                        plano.status_acao === 'EM_ANDAMENTO' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                            'bg-slate-100 text-slate-700 border-slate-200'
                                        }`}>
                                        {plano.status_acao?.replace('_', ' ') || 'PENDENTE'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <User size={16} className="text-slate-400" />
                                        <span><strong className="text-slate-800">Quem:</strong> {plano.who}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Calendar size={16} className="text-slate-400" />
                                        <span><strong className="text-slate-800">Quando:</strong> {new Date(plano.when_date || '').toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <DollarSign size={16} className="text-slate-400" />
                                        <span><strong className="text-slate-800">Custo:</strong> {plano.how_much}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : viewMode === 'STANDALONE' ? (
                /* Standalone Tasks Mode */
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-purple-50 px-8 py-6 border-b border-purple-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <ListCheck className="text-purple-600" />
                                Tarefas Avulsas
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">Gerencie tarefas rápidas sem necessidade de um plano de ação completo.</p>
                        </div>
                        <button onClick={() => setViewMode('LIST')} className="text-slate-400 hover:text-slate-600 transition">
                            <XCircle size={28} />
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                <div className="md:col-span-12 lg:col-span-4">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Descrição</label>
                                    <input
                                        className="w-full px-3 py-2 border rounded text-sm"
                                        placeholder="Descreva a tarefa..."
                                        value={newTask.descricao}
                                        onChange={e => setNewTask({ ...newTask, descricao: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-6 lg:col-span-3">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Responsável</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded text-sm"
                                        value={newTask.responsavel}
                                        onChange={e => setNewTask({ ...newTask, responsavel: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {mockUsers.map(user => <option key={user} value={user}>{user}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-6 lg:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Prazo</label>
                                    <input type="date" className="w-full px-2 py-2 border rounded text-sm"
                                        value={newTask.prazo}
                                        onChange={e => setNewTask({ ...newTask, prazo: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-6 lg:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 font-black">Ativo</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded text-sm"
                                        value={newTask.maquina_id}
                                        onChange={e => setNewTask({ ...newTask, maquina_id: e.target.value })}
                                    >
                                        <option value="">Nenhum</option>
                                        {maquinas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-6 lg:col-span-1">
                                    <button
                                        type="button"
                                        onClick={handleAddStandaloneTask}
                                        className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 flex justify-center"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {standaloneTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition">
                                    <div className="flex items-center gap-4">
                                        <button
                                            className={`p-1 rounded-full transition ${task.status === 'CONCLUIDA' ? 'text-green-500 bg-green-50' : 'text-slate-300 hover:text-slate-500'}`}
                                            onClick={() => toggleTaskStatus(task)}
                                        >
                                            <CheckCircle size={24} className={task.status === 'CONCLUIDA' ? 'fill-current' : ''} />
                                        </button>
                                        <div>
                                            <h4 className={`font-bold text-slate-800 ${task.status === 'CONCLUIDA' ? 'line-through text-slate-400' : ''}`}>
                                                {task.descricao}
                                            </h4>
                                            <div className="flex gap-4 text-xs text-slate-500 mt-1">
                                                <span className="flex items-center gap-1"><User size={12} /> {task.responsavel}</span>
                                                <span className="flex items-center gap-1"><Calendar size={12} /> Prazo: {new Date(task.prazo).toLocaleDateString()}</span>
                                                {task.maquina_id && <span className="flex items-center gap-1 text-orange-600"><MachineIcon size={12} /> {maquinas.find(m => m.id === task.maquina_id)?.nome}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteStandaloneTask(task.id)}
                                        className="text-slate-300 hover:text-red-500 p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* Form Mode */
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {formData.nao_conformidade_id ? <Activity className="text-red-500" /> : <Plus className="text-blue-500" />}
                                {formData.id ? 'Editar Plano de Ação' : 'Novo Plano de Ação'}
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">Preencha todos os campos da metodologia 5W2H</p>
                        </div>
                        <button onClick={() => setViewMode('LIST')} className="text-slate-400 hover:text-slate-600 transition">
                            <XCircle size={28} />
                        </button>
                    </div>

                    <form onSubmit={handleSavePlano} className="p-8">
                        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Título do Plano</label>
                                <input
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Instalação de sensores de temperatura"
                                    required
                                    value={formData.titulo}
                                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="md:col-span-2 relative">
                                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-blue-500 rounded-full"></div>
                                <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                    <ClipboardCheck size={18} className="text-blue-500" />
                                    1. WHAT (O que será feito?)
                                </label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-20"
                                    placeholder="Descreva a ação a ser realizada..."
                                    required
                                    value={formData.what}
                                    onChange={e => setFormData({ ...formData, what: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                                    <HelpCircle size={16} className="text-slate-400" />
                                    2. WHY (Por que?)
                                </label>
                                <input
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Justificativa / Motivo"
                                    required
                                    value={formData.why}
                                    onChange={e => setFormData({ ...formData, why: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                                    <MapPin size={16} className="text-slate-400" />
                                    3. WHERE (Onde?)
                                </label>
                                <input
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Local de execução"
                                    required
                                    value={formData.where_loc}
                                    onChange={e => setFormData({ ...formData, where_loc: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400" />
                                    4. WHEN (Quando?)
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                    value={formData.when_date}
                                    onChange={e => setFormData({ ...formData, when_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                                    <User size={16} className="text-slate-400" />
                                    5. WHO (Quem?)
                                </label>
                                <input
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Responsável pela execução"
                                    required
                                    value={formData.who}
                                    onChange={e => setFormData({ ...formData, who: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                                    <Wrench size={16} className="text-slate-400" />
                                    6. HOW (Como?)
                                </label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                                    placeholder="Método, procedimento ou detalhamento da execução..."
                                    required
                                    value={formData.how}
                                    onChange={e => setFormData({ ...formData, how: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                                    <DollarSign size={16} className="text-slate-400" />
                                    7. HOW MUCH (Quanto custa?)
                                </label>
                                <input
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Custo estimado (0,00)"
                                    value={formData.how_much}
                                    onChange={e => setFormData({ ...formData, how_much: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <ListCheck size={20} className="text-slate-600" />
                                Lista de Tarefas e Responsáveis
                            </h3>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                    <div className="md:col-span-5">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Descrição da Tarefa</label>
                                        <input
                                            className="w-full px-3 py-2 border rounded text-sm"
                                            placeholder="O que precisa ser feito?"
                                            value={newTask.descricao}
                                            onChange={e => setNewTask({ ...newTask, descricao: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Responsável</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded text-sm"
                                            value={newTask.responsavel}
                                            onChange={e => setNewTask({ ...newTask, responsavel: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            {mockUsers.map(user => <option key={user} value={user}>{user}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Ativo</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded text-sm"
                                            value={newTask.maquina_id}
                                            onChange={e => setNewTask({ ...newTask, maquina_id: e.target.value })}
                                        >
                                            <option value="">Nenhum</option>
                                            {maquinas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <button
                                            type="button"
                                            onClick={handleAddTask}
                                            className="w-full bg-slate-800 text-white px-6 py-2 rounded-lg font-black text-xs hover:bg-slate-900 transition-all shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} />
                                            ADD
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {currentTasks.map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div
                                                onClick={() => toggleTaskStatus(task)}
                                                className={`cursor-pointer transition-colors ${task.status === 'CONCLUIDA' ? 'text-teal-600' : 'text-slate-300 hover:text-teal-400'}`}
                                            >
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-slate-700 font-bold ${task.status === 'CONCLUIDA' ? 'line-through opacity-50' : ''}`}>
                                                    {task.descricao}
                                                </p>
                                                <div className="flex gap-4 mt-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                                                        <User size={12} /> {task.responsavel}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                                                        <Calendar size={12} /> Prazo: {new Date(task.prazo).toLocaleDateString()}
                                                    </span>
                                                    {task.maquina_id && <span className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-1">
                                                        <MachineIcon size={12} /> {maquinas.find(m => m.id === task.maquina_id)?.nome}
                                                    </span>}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="text-slate-400 hover:text-red-500 p-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setViewMode('LIST')}
                                className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Save size={18} />
                                Salvar Plano de Ação
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {isOSModalOpen && taskParaOS && (
                <OSModal
                    isOpen={isOSModalOpen}
                    onClose={() => {
                        setIsOSModalOpen(false);
                        setTaskParaOS(null);
                    }}
                    onSuccess={handleOSSuccess}
                    maquinaId={taskParaOS.maquina_id!}
                    maquinaNome={maquinas.find(m => m.id === taskParaOS.maquina_id)?.nome || 'Ativo'}
                    taskTitle={taskParaOS.descricao}
                />
            )}
        </div>
    );
};

export default PlanosAcao;
