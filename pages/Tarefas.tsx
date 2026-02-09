import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ListTodo, Plus, Search, CheckCircle2,
    XCircle, Save, User, Calendar,
    Trash2, FolderKanban, CheckSquare,
    Settings as MachineIcon
} from 'lucide-react';
import { projetosService } from '../services/projetosService';
import { manutencaoService } from '../services/manutencaoService';
import { TarefaProjeto, Projeto } from '../types_projetos';
import { Maquina } from '../types_manutencao';
import { UserSelect } from '../components/UserSelect';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import OSModal from '../components/Manutencao/OSModal';
import { LoadingState } from '../components/LoadingState';
import { logger } from '../utils/logger';

const Tarefas: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();

    // State
    const [tarefas, setTarefas] = useState<TarefaProjeto[]>([]);
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

    // UX State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [tarefaToDelete, setTarefaToDelete] = useState<string | null>(null);
    const [isOSModalOpen, setIsOSModalOpen] = useState(false);
    const [tarefaParaOS, setTarefaParaOS] = useState<TarefaProjeto | null>(null);

    // Form State for new entry
    const [formData, setFormData] = useState<Partial<TarefaProjeto>>({
        projeto_id: '',
        titulo: '',
        descricao: '',
        responsavel_id: '',
        data_fim_prevista: '',
        status: 'PENDENTE',
        prioridade: 'MEDIA',
        horas_estimadas: 0,
        maquina_id: ''
    });

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [tarefasData, projetosData, maquinasData] = await Promise.all([
                projetosService.getTodasTarefas(),
                projetosService.getProjetos(),
                manutencaoService.getMaquinas()
            ]);
            setTarefas(tarefasData);
            setProjetos(projetosData.filter(p => p.status !== 'CONCLUIDO' && p.status !== 'CANCELADO'));
            setMaquinas(maquinasData);
            logger.debug('Dados carregados em Tarefas', { total: tarefasData.length });
        } catch (error) {
            logger.error('Erro ao carregar dados em Tarefas', error);
            toast.error('Erro de Conexão', 'Não foi possível carregar as tarefas.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.projeto_id || !formData.titulo || !formData.data_fim_prevista) {
                toast.error('Campos Obrigatórios', 'Preencha o projeto, título e o prazo.');
                return;
            }

            await projetosService.createTarefa(formData as any);
            toast.success('Tarefa Criada', 'A nova tarefa foi adicionada ao projeto.');
            await loadData();
            setViewMode('LIST');
            resetForm();
        } catch (error: any) {
            logger.error('Erro ao salvar tarefa', error);
            toast.error('Erro ao Salvar', error.message);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await projetosService.deleteTarefa(id);
            toast.success('Tarefa Excluída', 'O registro foi removido com sucesso.');
            await loadData();
            setIsDeleteDialogOpen(false);
            setTarefaToDelete(null);
        } catch (error: any) {
            logger.error('Erro ao excluir tarefa', error);
            toast.error('Erro ao Excluir', error.message);
        }
    };

    const toggleStatus = async (tarefa: TarefaProjeto) => {
        try {
            if (tarefa.status === 'CONCLUIDA') {
                await projetosService.updateTarefa(tarefa.id, { status: 'PENDENTE' });
                toast.success('Status Atualizado', 'Tarefa retornada para Pendente.');
                await loadData();
                return;
            }

            if (tarefa.maquina_id) {
                setTarefaParaOS(tarefa);
                setIsOSModalOpen(true);
            } else {
                await projetosService.updateTarefa(tarefa.id, { status: 'CONCLUIDA' });
                toast.success('Tarefa Concluída', 'O status foi atualizado com sucesso.');
                await loadData();
            }
        } catch (error: any) {
            logger.error('Erro ao atualizar status', error);
            toast.error('Erro', 'Não foi possível atualizar o status.');
        }
    };

    const handleOSSuccess = async (osId: string) => {
        if (tarefaParaOS) {
            try {
                await projetosService.updateTarefa(tarefaParaOS.id, {
                    status: 'CONCLUIDA',
                    os_id: osId
                });
                await loadData();
                setIsOSModalOpen(false);
                setTarefaParaOS(null);
            } catch (error: any) {
                logger.error('Erro ao vincular OS', error);
                toast.error('Erro', 'Falha ao vincular OS à tarefa.');
            }
        }
    };

    const resetForm = useCallback(() => {
        setFormData({
            projeto_id: '',
            titulo: '',
            descricao: '',
            responsavel_id: '',
            data_fim_prevista: '',
            status: 'PENDENTE',
            prioridade: 'MEDIA',
            horas_estimadas: 0,
            maquina_id: ''
        });
    }, []);

    // Memoized filtered tasks
    const filteredTarefas = useMemo(() => {
        return tarefas.filter(t => {
            const matchesSearch = t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.projeto?.nome.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
            return matchesSearch && matchesStatus;
        });
    }, [tarefas, searchTerm, selectedStatus]);

    if (loading) {
        return <LoadingState message="Carregando Tarefas..." size="lg" />;
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                        <ListTodo className="text-teal-600" size={32} />
                        Consulta de Tarefas
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Gestão operacional e acompanhamento de atividades</p>
                </div>
                {viewMode === 'LIST' && (
                    <button
                        onClick={() => setViewMode('FORM')}
                        className="bg-teal-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 font-black text-base"
                    >
                        <Plus size={20} />
                        Nova Tarefa
                    </button>
                )}
            </div>

            {viewMode === 'LIST' ? (
                <>
                    {/* Dashboard KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{tarefas.length}</h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pendentes</p>
                            <h3 className="text-3xl font-black text-blue-600 mt-1">
                                {tarefas.filter(t => t.status === 'PENDENTE' || t.status === 'EM_ANDAMENTO').length}
                            </h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Atrasadas</p>
                            <h3 className="text-3xl font-black text-red-600 mt-1">
                                {tarefas.filter(t => t.status !== 'CONCLUIDA' && new Date(t.data_fim_prevista) < new Date()).length}
                            </h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Concluídas</p>
                            <h3 className="text-3xl font-black text-teal-600 mt-1">
                                {tarefas.filter(t => t.status === 'CONCLUIDA').length}
                            </h3>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar tarefas por título, projeto ou descrição..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-teal-500 outline-none transition-all font-medium text-slate-700"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-teal-500 outline-none transition-all font-bold text-slate-600 appearance-none min-w-[150px]"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="ALL">Todos Status</option>
                                <option value="PENDENTE">Pendente</option>
                                <option value="EM_ANDAMENTO">Em Andamento</option>
                                <option value="BLOQUEADA">Bloqueada</option>
                                <option value="CONCLUIDA">Concluída</option>
                            </select>
                        </div>
                    </div>

                    {/* Task cards list */}
                    <div className="grid grid-cols-1 gap-4">
                        {filteredTarefas.map((tarefa) => (
                            <div
                                key={tarefa.id}
                                className="group bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-2xl hover:border-teal-200 transition-all cursor-pointer relative overflow-hidden active:scale-[0.99]"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="bg-teal-50 text-teal-600 p-1.5 rounded-lg">
                                            <FolderKanban size={14} />
                                        </div>
                                        <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{tarefa.projeto?.nome}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className={`text-lg font-black text-slate-800 truncate tracking-tight ${tarefa.status === 'CONCLUIDA' ? 'line-through opacity-50' : ''}`}>
                                            {tarefa.titulo}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${tarefa.prioridade === 'URGENTE' ? 'bg-red-100 text-red-600' :
                                            tarefa.prioridade === 'ALTA' ? 'bg-orange-100 text-orange-600' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {tarefa.prioridade}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <User size={14} />
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                                                {tarefa.responsavel?.nome || 'Não Atribuída'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar size={14} />
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                                                Vence: {new Date(tarefa.data_fim_prevista).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {tarefa.maquina_id && (
                                            <div className="flex items-center gap-2 text-orange-500">
                                                <MachineIcon size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-tighter">
                                                    {maquinas.find(m => m.id === tarefa.maquina_id)?.nome || 'Ativo Industrial'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3 min-w-[120px]">
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${tarefa.status === 'CONCLUIDA' ? 'bg-green-600 text-white' :
                                        tarefa.status === 'EM_ANDAMENTO' ? 'bg-blue-600 text-white' :
                                            tarefa.status === 'BLOQUEADA' ? 'bg-red-500 text-white' :
                                                'bg-slate-800 text-white'
                                        }`}>
                                        {tarefa.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        className={`p-3 rounded-xl transition-all ${tarefa.status === 'CONCLUIDA' ? 'text-green-600 bg-green-50' : 'text-slate-300 hover:text-teal-600 hover:bg-teal-50'
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleStatus(tarefa);
                                        }}
                                    >
                                        {tarefa.status === 'CONCLUIDA' ? <CheckCircle2 size={20} /> : <CheckSquare size={20} />}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTarefaToDelete(tarefa.id);
                                            setIsDeleteDialogOpen(true);
                                        }}
                                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredTarefas.length === 0 && (
                            <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-slate-100 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ListTodo size={40} className="text-slate-200" />
                                </div>
                                <h4 className="text-xl font-black text-slate-400 uppercase tracking-widest">Nenhuma tarefa encontrada</h4>
                                <p className="text-slate-400 font-medium">Não há atividades cadastradas para os critérios selecionados.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* FORM VIEW */
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-w-4xl mx-auto">
                    <div className="bg-teal-900 p-8 flex justify-between items-center text-white">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Nova Tarefa</h2>
                            <p className="text-teal-400 text-sm font-medium">Defina uma nova atividade para o projeto</p>
                        </div>
                        <button onClick={() => setViewMode('LIST')} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition">
                            <XCircle size={28} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Projeto Vinculado *</label>
                                <select
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-lg transition-all outline-none font-medium appearance-none"
                                    required
                                    value={formData.projeto_id}
                                    onChange={e => setFormData({ ...formData, projeto_id: e.target.value })}
                                >
                                    <option value="">Selecione o projeto...</option>
                                    {projetos.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Título da Tarefa *</label>
                                <input
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-lg transition-all outline-none font-medium"
                                    placeholder="Ex: Definir requisitos técnicos"
                                    required
                                    value={formData.titulo}
                                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descrição</label>
                                <textarea
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-lg transition-all outline-none font-medium h-24"
                                    placeholder="Detalhes sobre o que deve ser feito..."
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Responsável</label>
                                <UserSelect
                                    value={formData.responsavel_id}
                                    onChange={(value) => setFormData({ ...formData, responsavel_id: value })}
                                    label=""
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Prazo de Entrega *</label>
                                <input
                                    type="date"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-lg transition-all outline-none font-medium"
                                    required
                                    value={formData.data_fim_prevista}
                                    onChange={e => setFormData({ ...formData, data_fim_prevista: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Status Inicial</label>
                                <select
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-lg transition-all outline-none font-medium appearance-none"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    <option value="PENDENTE">Pendente</option>
                                    <option value="EM_ANDAMENTO">Em Andamento</option>
                                    <option value="BLOQUEADA">Bloqueada</option>
                                    <option value="CONCLUIDA">Concluída</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ativo Relacionado (Opcional)</label>
                                <select
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-lg transition-all outline-none font-medium appearance-none"
                                    value={formData.maquina_id}
                                    onChange={e => setFormData({ ...formData, maquina_id: e.target.value })}
                                >
                                    <option value="">Não relacionado a máquina</option>
                                    {maquinas.map(m => (
                                        <option key={m.id} value={m.id}>{m.nome} ({m.modelo})</option>
                                    ))}
                                </select>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 ml-1 uppercase">Se selecionado, será exigido preenchimento de OS ao concluir.</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Prioridade</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'].map(prio => (
                                        <button
                                            type="button"
                                            key={prio}
                                            onClick={() => setFormData({ ...formData, prioridade: prio as any })}
                                            className={`py-4 px-2 text-[10px] font-black rounded-xl border transition-all shadow-sm ${formData.prioridade === prio
                                                ? (prio === 'URGENTE' ? 'bg-red-600 text-white border-red-600' : 'bg-teal-900 text-white border-teal-900')
                                                : 'bg-white text-slate-400 border-slate-200 hover:border-teal-300 hover:text-teal-600'
                                                }`}
                                        >
                                            {prio}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse md:flex-row justify-end gap-4 border-t pt-8 border-slate-100">
                            <button
                                type="button"
                                onClick={() => setViewMode('LIST')}
                                className="px-10 py-4 text-slate-500 font-black uppercase tracking-widest hover:text-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-teal-600 text-white px-10 py-4 rounded-2xl font-black shadow-2xl shadow-teal-600/30 hover:bg-teal-700 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Save size={20} />
                                Adicionar Tarefa
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* UX Support Components */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                title="Remover Tarefa?"
                message="Deseja realmente excluir esta tarefa? Esta ação não poderá ser desfeita."
                confirmText="Remover Definitivamente"
                cancelText="Mantenha a Tarefa"
                onConfirm={() => tarefaToDelete && handleDelete(tarefaToDelete)}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setTarefaToDelete(null);
                }}
            />

            {isOSModalOpen && tarefaParaOS && (
                <OSModal
                    isOpen={isOSModalOpen}
                    onClose={() => {
                        setIsOSModalOpen(false);
                        setTarefaParaOS(null);
                    }}
                    onSuccess={handleOSSuccess}
                    maquinaId={tarefaParaOS.maquina_id!}
                    maquinaNome={maquinas.find(m => m.id === tarefaParaOS.maquina_id)?.nome || 'Ativo'}
                    taskTitle={tarefaParaOS.titulo}
                />
            )}
        </div>
    );
};

export default Tarefas;
