
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FolderKanban, Plus, Search, Filter, CheckCircle2, Clock,
    XCircle, FileText, ChevronRight, Save, User, Calendar,
    TrendingUp, AlertCircle, MoreVertical, Edit2, Trash2
} from 'lucide-react';
import { projetosService } from '../services/projetosService';
import { segurancaService } from '../services/segurancaService';
import { Projeto, StatusProjeto, Prioridade } from '../types_projetos';
// import { Usuario } from '../types_seguranca'; // Removed
import { UserSelect } from '../components/UserSelect';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

const Projetos: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();

    // State
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

    // UX State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [projetoToDelete, setProjetoToDelete] = useState<string | null>(null);

    // Form State for new entry
    const [formData, setFormData] = useState<Partial<Projeto>>({
        nome: '',
        descricao: '',
        responsavel_id: '',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim_prevista: '',
        status: 'PLANEJAMENTO',
        prioridade: 'MEDIA',
        orcamento: 0
    });

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setLoading(true);
            const projetosData = await projetosService.getProjetos();
            setProjetos(projetosData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro de Conexão', 'Não foi possível carregar os projetos.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.nome || !formData.data_inicio || !formData.data_fim_prevista) {
                toast.error('Campos Obrigatórios', 'Por favor, preencha o nome e as datas.');
                return;
            }

            await projetosService.createProjeto(formData as any);
            toast.success('Projeto Criado', 'O novo projeto foi registrado com sucesso.');
            await loadData();
            setViewMode('LIST');
            resetForm();
        } catch (error: any) {
            toast.error('Erro ao Salvar', error.message);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await projetosService.deleteProjeto(id);
            toast.success('Projeto Excluído', 'O registro foi removido com sucesso.');
            await loadData();
            setIsDeleteDialogOpen(false);
            setProjetoToDelete(null);
        } catch (error: any) {
            toast.error('Erro ao Excluir', error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            nome: '',
            descricao: '',
            responsavel_id: '',
            data_inicio: new Date().toISOString().split('T')[0],
            data_fim_prevista: '',
            status: 'PLANEJAMENTO',
            prioridade: 'MEDIA',
            orcamento: 0
        });
    };

    const filteredProjetos = projetos.filter(p => {
        const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium font-mono">Carregando Projetos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                        <FolderKanban className="text-teal-600" size={32} />
                        Consulta de Projetos
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Listagem e gestão estratégica de projetos corporativos</p>
                </div>
                {viewMode === 'LIST' && (
                    <button
                        onClick={() => setViewMode('FORM')}
                        className="bg-teal-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 font-black text-base"
                    >
                        <Plus size={20} />
                        Novo Projeto
                    </button>
                )}
            </div>

            {viewMode === 'LIST' ? (
                <>
                    {/* Dashboard KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{projetos.length}</h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Em Andamento</p>
                            <h3 className="text-3xl font-black text-blue-600 mt-1">
                                {projetos.filter(p => p.status === 'EM_ANDAMENTO').length}
                            </h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Atrasados</p>
                            <h3 className="text-3xl font-black text-red-600 mt-1">
                                {projetos.filter(p => p.status === 'EM_ANDAMENTO' && new Date(p.data_fim_prevista) < new Date()).length}
                            </h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Concluídos</p>
                            <h3 className="text-3xl font-black text-teal-600 mt-1">
                                {projetos.filter(p => p.status === 'CONCLUIDO').length}
                            </h3>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar projetos por nome ou descrição..."
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
                                <option value="PLANEJAMENTO">Planejamento</option>
                                <option value="EM_ANDAMENTO">Em Andamento</option>
                                <option value="PAUSADO">Pausado</option>
                                <option value="CONCLUIDO">Concluído</option>
                                <option value="CANCELADO">Cancelado</option>
                            </select>
                        </div>
                    </div>

                    {/* table-like listing with nice cards */}
                    <div className="grid grid-cols-1 gap-4">
                        {filteredProjetos.map((projeto) => (
                            <div
                                key={projeto.id}
                                className="group bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-2xl hover:border-teal-200 transition-all cursor-pointer relative overflow-hidden active:scale-[0.99]"
                                onClick={() => navigate(`/projetos/detalhes/${projeto.id}`)}
                            >
                                {/* Color stripe */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${projeto.status === 'CONCLUIDO' ? 'bg-green-500' :
                                    projeto.status === 'EM_ANDAMENTO' ? 'bg-blue-500' :
                                        projeto.status === 'CANCELADO' ? 'bg-red-500' :
                                            'bg-slate-400'
                                    }`}></div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-black text-slate-800 truncate tracking-tight">{projeto.nome}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${projeto.prioridade === 'URGENTE' ? 'bg-red-100 text-red-600' :
                                            projeto.prioridade === 'ALTA' ? 'bg-orange-100 text-orange-600' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {projeto.prioridade}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium line-clamp-1 mb-4">{projeto.descricao}</p>

                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <User size={16} />
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
                                                {projeto.responsavel?.nome || 'Sem Responsável'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar size={16} />
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
                                                Prazo: {new Date(projeto.data_fim_prevista).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {/* Mock avatars or just stats */}
                                                <div className="w-6 h-6 rounded-full bg-teal-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-teal-600">
                                                    {projeto.progresso}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3 min-w-[120px]">
                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${projeto.status === 'CONCLUIDO' ? 'bg-green-600 text-white' :
                                        projeto.status === 'EM_ANDAMENTO' ? 'bg-blue-600 text-white' :
                                            projeto.status === 'PAUSADO' ? 'bg-yellow-500 text-white' :
                                                'bg-slate-800 text-white'
                                        }`}>
                                        {projeto.status.replace('_', ' ')}
                                    </span>

                                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-1000 ${projeto.progresso === 100 ? 'bg-green-500' : 'bg-teal-500'
                                                }`}
                                            style={{ width: `${projeto.progresso}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // TODO: Edit flow
                                        }}
                                        className="p-3 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProjetoToDelete(projeto.id);
                                            setIsDeleteDialogOpen(true);
                                        }}
                                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <ChevronRight className="text-slate-300 group-hover:translate-x-1 group-hover:text-teal-600 transition-all" size={24} />
                                </div>
                            </div>
                        ))}

                        {filteredProjetos.length === 0 && (
                            <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-slate-100 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FolderKanban size={40} className="text-slate-200" />
                                </div>
                                <h4 className="text-xl font-black text-slate-400 uppercase tracking-widest">Nenhum projeto encontrado</h4>
                                <p className="text-slate-400 font-medium">Experimente mudar os filtros ou criar um novo registro.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* FORM VIEW */
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-w-4xl mx-auto">
                    <div className="bg-teal-900 p-8 flex justify-between items-center text-white">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Novo Projeto</h2>
                            <p className="text-teal-400 text-sm font-medium">Cadastre e inicie uma nova jornada estratégica</p>
                        </div>
                        <button onClick={() => setViewMode('LIST')} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition">
                            <XCircle size={28} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome do Projeto *</label>
                                <input
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-lg transition-all outline-none font-medium"
                                    placeholder="Ex: Implementação Sistema ERP"
                                    required
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descrição do Projeto</label>
                                <textarea
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-lg transition-all outline-none font-medium h-32"
                                    placeholder="Descreva aqui o escopo e objetivos..."
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 text-inherit">Prioridade do Projeto</label>
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

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Responsável Inicial</label>
                                <UserSelect
                                    value={formData.responsavel_id}
                                    onChange={(value) => setFormData({ ...formData, responsavel_id: value })}
                                    label=""
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Data Início</label>
                                <input
                                    type="date"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-lg transition-all outline-none font-medium"
                                    required
                                    value={formData.data_inicio}
                                    onChange={e => setFormData({ ...formData, data_inicio: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 text-red-600">Prazo Estimado *</label>
                                <input
                                    type="date"
                                    className="w-full px-6 py-4 bg-slate-50 border border-red-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 text-lg transition-all outline-none font-medium ring-2 ring-red-500/5 shadow-inner"
                                    required
                                    value={formData.data_fim_prevista}
                                    onChange={e => setFormData({ ...formData, data_fim_prevista: e.target.value })}
                                />
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
                                Iniciar Projeto
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* UX Support Components */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                title="Excluir Projeto?"
                message="Esta ação irá remover permanentemente o projeto e todos os seus dados vinculados. Não é possível desfazer."
                confirmText="Sim, excluir projeto"
                cancelText="Mantenha o registro"
                onConfirm={() => projetoToDelete && handleDelete(projetoToDelete)}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setProjetoToDelete(null);
                }}
            />
        </div>
    );
};

export default Projetos;
