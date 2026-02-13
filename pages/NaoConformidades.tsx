
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus, Search, Filter, CheckCircle, Clock, XCircle, FileText, ChevronRight, Save, ShieldAlert, Upload, Image as ImageIcon, Trash2, FolderPlus, Download, LayoutGrid, List as ListIcon, MoreVertical, Calendar } from 'lucide-react';
import { UserSelect } from '../components/UserSelect';
import { NaoConformidade } from '../types_nc';
import { qualidadeService } from '../services/qualidadeService';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import CriarProjetoModal from '../components/CriarProjetoModal';
import MobileCard from '../components/MobileCard';
import FAB from '../components/FAB';

// Components
const KpiCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: 'slate' | 'red' | 'amber' | 'green' | 'blue' | 'orange' }) => {
    const colorClasses = {
        slate: 'text-slate-600 bg-slate-50 border-slate-200',
        red: 'text-red-600 bg-red-50 border-red-200',
        amber: 'text-amber-600 bg-amber-50 border-amber-200',
        green: 'text-green-600 bg-green-50 border-green-200',
        blue: 'text-blue-600 bg-blue-50 border-blue-200',
        orange: 'text-orange-600 bg-orange-50 border-orange-200'
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-24">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color].split(' ')[1]} ${colorClasses[color].split(' ')[0]}`}>
                <Icon size={18} />
            </div>
            <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                <div className="text-2xl font-bold text-slate-800 leading-none mt-1">{value}</div>
            </div>
        </div>
    );
};

const Badge = ({ label, color, variant = 'soft' }: { label: string, color: string, variant?: 'soft' | 'solid' }) => {
    const baseColors: any = {
        slate: 'bg-slate-100 text-slate-700',
        red: 'bg-red-100 text-red-700',
        amber: 'bg-amber-100 text-amber-700',
        green: 'bg-green-100 text-green-700',
        blue: 'bg-blue-100 text-blue-700',
        orange: 'bg-orange-100 text-orange-700'
    };

    const solidColors: any = {
        slate: 'bg-slate-600 text-white',
        red: 'bg-red-600 text-white',
        amber: 'bg-amber-500 text-white',
        green: 'bg-green-600 text-white',
        blue: 'bg-blue-600 text-white',
        orange: 'bg-orange-500 text-white'
    };

    const classes = variant === 'solid' ? solidColors[color] || solidColors.slate : baseColors[color] || baseColors.slate;

    return (
        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${classes}`}>
            {label}
        </span>
    );
};

const NaoConformidades: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();

    // State
    const [ocorrencias, setOcorrencias] = useState<NaoConformidade[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'ANALYSIS'>('LIST');
    const [listLayout, setListLayout] = useState<'CARDS' | 'TABLE'>('CARDS');
    const [selectedOcorrencia, setSelectedOcorrencia] = useState<NaoConformidade | null>(null);

    // UX State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [ncToDelete, setNcToDelete] = useState<string | null>(null);
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

    // Form State for new entry
    const [formData, setFormData] = useState<Partial<NaoConformidade> & { responsavel_contencao?: string }>({
        severidade: 'MEDIA',
        tipo: 'PROCESSO',
        data_ocorrencia: new Date().toISOString().split('T')[0],
        acao_contencao: '',
        responsavel_contencao: '',
        evidencias: []
    });

    // const MOCK_RESPONSAVEIS = ['João Silva', 'Maria Souza', 'Carlos Oliveira', 'Ana Beatriz', 'Pedro Santos']; // Removed

    // Five Whys State
    const [fiveWhys, setFiveWhys] = useState({
        pq1: '', pq2: '', pq3: '', pq4: '', pq5: '',
        causa_raiz: ''
    });

    // Load data from Supabase on mount
    useEffect(() => {
        loadNaoConformidades();
    }, []);

    const loadNaoConformidades = async () => {
        try {
            setLoading(true);
            const data = await qualidadeService.getNaoConformidades();
            setOcorrencias(data);
        } catch (error) {
            console.error('Erro ao carregar não conformidades:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAnalysis = async (ocorrencia: NaoConformidade) => {
        setSelectedOcorrencia(ocorrencia);

        // Load existing analysis if available
        try {
            const analise = await qualidadeService.getAnaliseCausa(ocorrencia.id);
            if (analise) {
                setFiveWhys({
                    pq1: analise.pq1 || '',
                    pq2: analise.pq2 || '',
                    pq3: analise.pq3 || '',
                    pq4: analise.pq4 || '',
                    pq5: analise.pq5 || '',
                    causa_raiz: analise.causa_raiz || ''
                });
            } else {
                setFiveWhys({
                    pq1: '', pq2: '', pq3: '', pq4: '', pq5: '',
                    causa_raiz: ''
                });
            }
        } catch (error) {
            console.error('Erro ao carregar análise:', error);
        }

        setViewMode('ANALYSIS');
    };

    const handleSaveAnalysis = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOcorrencia) return;

        try {
            await qualidadeService.saveAnaliseCausa(selectedOcorrencia.id, fiveWhys);
            await loadNaoConformidades();
            toast.success('Análise de Causa Salva', 'A análise foi registrada com sucesso.');
            navigate(`/qualidade/planos-acao?nc_id=${selectedOcorrencia.id}&nc_title=${encodeURIComponent(selectedOcorrencia.titulo)}`);
        } catch (error) {
            console.error('Erro ao salvar análise:', error);
            toast.error('Erro ao Salvar', 'Não foi possível salvar a análise. Tente novamente.');
        }
    };

    const handleDeleteNC = async (id: string) => {
        try {
            await qualidadeService.deleteNaoConformidade(id);
            await loadNaoConformidades();
            toast.success('RNC Excluída', 'O registro foi removido com sucesso.');
            if (viewMode !== 'LIST') setViewMode('LIST');
        } catch (error) {
            console.error('Erro ao excluir NC:', error);
            toast.error('Erro ao Excluir', 'Não foi possível excluir a RNC.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const newEntry: Omit<NaoConformidade, 'id' | 'created_at'> = {
                titulo: formData.titulo || '',
                descricao: formData.descricao || '',
                tipo: formData.tipo as any,
                origem: formData.origem || '',
                data_ocorrencia: formData.data_ocorrencia || '',
                status: 'EM_ANALISE',
                severidade: formData.severidade as any,
                responsavel_id: 'Current User', // TODO: Get from auth context
                acao_contencao: formData.acao_contencao || '',
                evidencias: formData.evidencias || []
            };

            const createdNC = await qualidadeService.createNaoConformidade(newEntry);
            toast.success('NC Registrada', 'Não conformidade registrada com sucesso.');



            await loadNaoConformidades();
            setViewMode('LIST');
            setFormData({
                severidade: 'MEDIA',
                tipo: 'PROCESSO',
                data_ocorrencia: new Date().toISOString().split('T')[0],
                acao_contencao: '',
                evidencias: []
            });
        } catch (error) {
            console.error('Erro ao criar não conformidade:', error);
            toast.error('Erro ao Registrar', 'Não foi possível registrar a RNC. Verifique os dados.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium tracking-tight">Carregando registros...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            {viewMode === 'LIST' && (
                <>
                    {/* Dashboard Header & KPIs */}
                    <div className="space-y-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Gestão de Problemas</h1>
                            <p className="text-slate-500">Registre e resolva não conformidades em {'{SCR Argamassas}'}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            <KpiCard icon={AlertTriangle} label="Total" value={ocorrencias.length} color="slate" />
                            <KpiCard icon={AlertTriangle} label="Abertos" value={ocorrencias.filter(o => o.status !== 'CONCLUIDO' && o.status !== 'CANCELADO').length} color="red" />
                            <KpiCard icon={Clock} label="Analisando" value={ocorrencias.filter(o => o.status === 'EM_ANALISE').length} color="amber" />
                            <KpiCard icon={CheckCircle} label="Resolvidos" value={ocorrencias.filter(o => o.status === 'CONCLUIDO').length} color="green" />
                            <KpiCard icon={XCircle} label="Fechados" value={ocorrencias.filter(o => o.status === 'CONCLUIDO').length} color="slate" />
                            <KpiCard icon={AlertTriangle} label="Alta Prioridade" value={ocorrencias.filter(o => o.severidade === 'ALTA' || o.severidade === 'CRITICA').length} color="red" />
                            <KpiCard icon={Clock} label="Atrasados" value={9} color="orange" />
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                placeholder="Buscar problemas..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium">
                                <Download size={18} />
                                Exportar
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium">
                                <Filter size={18} />
                                Filtrar
                            </button>
                            <div className="flex bg-white border border-slate-200 rounded-xl p-1">
                                <button
                                    onClick={() => setListLayout('CARDS')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${listLayout === 'CARDS' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <LayoutGrid size={16} />
                                    Cards
                                </button>
                                <button
                                    onClick={() => setListLayout('TABLE')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${listLayout === 'TABLE' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <ListIcon size={16} />
                                    Lista
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => setViewMode('FORM')}
                            className="bg-amber-400 text-amber-950 px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-500 transition-all font-bold text-sm"
                        >
                            <Plus size={18} />
                            Novo Problema
                        </button>
                    </div>

                    {/* Content View */}
                    {listLayout === 'CARDS' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ocorrencias.map(oc => (
                                <MobileCard
                                    key={oc.id}
                                    title={oc.titulo}
                                    subtitle={`${oc.tipo} • ${new Date(oc.data_ocorrencia).toLocaleDateString()}`}
                                    icon={ShieldAlert}
                                    badge={{
                                        text: oc.status === 'CONCLUIDO' ? 'Resolvido' : 'Aberto',
                                        color: oc.status === 'CONCLUIDO' ? 'success' : 'danger'
                                    }}
                                    onClick={() => handleOpenAnalysis(oc)}
                                >
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-500 line-clamp-2 h-10">
                                            {oc.descricao}
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            <Badge label={oc.severidade} color={oc.severidade === 'CRITICA' ? 'red' : oc.severidade === 'ALTA' ? 'amber' : 'slate'} variant={oc.severidade === 'CRITICA' ? 'solid' : 'soft'} />
                                            {oc.origem && <Badge label={oc.origem} color="blue" />}
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenAnalysis(oc);
                                            }}
                                            className="w-full bg-slate-900 text-white rounded-xl py-4 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        >
                                            <AlertTriangle size={18} />
                                            Resolver Problema
                                        </button>
                                    </div>
                                </MobileCard>
                            ))}
                        </div>
                    ) : (
                        <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {/* Simple List View Placeholder */}
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Título</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium">Data</th>
                                        <th className="px-6 py-3 font-medium">Severidade</th>
                                        <th className="px-6 py-3 font-medium text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {ocorrencias.map(oc => (
                                        <tr key={oc.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{oc.titulo}</td>
                                            <td className="px-6 py-4">{oc.status}</td>
                                            <td className="px-6 py-4">{new Date(oc.data_ocorrencia).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">{oc.severidade}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleOpenAnalysis(oc)}
                                                    className="bg-indigo-600 text-white shadow-md rounded-lg px-4 py-2 hover:bg-indigo-700 transition-all font-bold text-xs flex items-center gap-2 ml-auto"
                                                >
                                                    <AlertTriangle size={14} />
                                                    Resolver problema
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {viewMode === 'FORM' && (
                /* Form Mode */
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-slate-900 p-8 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Registar RNC</h2>
                            <p className="text-slate-400 text-sm font-medium">Relatório de Não Conformidade</p>
                        </div>
                        <button onClick={() => setViewMode('LIST')} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition text-white">
                            <XCircle size={28} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Título da Ocorrência *</label>
                                <input
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-lg transition-all outline-none font-medium"
                                    placeholder="Ex: Divergência de estoque no almoxarifado 2"
                                    required
                                    value={formData.titulo}
                                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Origem / Local *</label>
                                <input
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-lg transition-all outline-none font-medium"
                                    placeholder="Onde aconteceu?"
                                    required
                                    value={formData.origem}
                                    onChange={e => setFormData({ ...formData, origem: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Data da Ocorrência *</label>
                                <input
                                    type="date"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-lg transition-all outline-none font-medium"
                                    required
                                    value={formData.data_ocorrencia}
                                    onChange={e => setFormData({ ...formData, data_ocorrencia: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Tipo de Categoria *</label>
                                <select
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-lg transition-all outline-none font-medium appearance-none"
                                    value={formData.tipo}
                                    onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                                >
                                    <option value="PROCESSO">Qualidade de Processo</option>
                                    <option value="PRODUTO">Qualidade de Produto</option>
                                    <option value="SEGURANCA">Segurança do Trabalho</option>
                                    <option value="AMBIENTAL">Risco Ambiental</option>
                                    <option value="OUTROS">Outros</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Impacto / Severidade *</label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                    {['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'].map(sev => (
                                        <button
                                            type="button"
                                            key={sev}
                                            onClick={() => setFormData({ ...formData, severidade: sev as any })}
                                            className={`py-4 px-2 text-xs font-black rounded-xl border transition-all shadow-sm ${formData.severidade === sev
                                                ? (sev === 'CRITICA' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-900 text-white border-slate-900')
                                                : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                                }`}
                                        >
                                            {sev}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Descrição do Problema *</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-lg transition-all outline-none font-medium h-32"
                                    placeholder="Explique detalhadamente o que foi observado..."
                                    required
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                />
                            </div>



                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-black text-slate-700 mb-4 uppercase tracking-widest">Evidências Visuais</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Upload Trigger */}
                                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer aspect-square relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        const base64String = reader.result as string;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            evidencias: [...(prev.evidencias || []), base64String]
                                                        }));
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                <Upload size={24} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-tighter">Capturar</span>
                                        </div>
                                    </div>

                                    {/* Preview List */}
                                    {formData.evidencias?.map((img, index) => (
                                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                                            <img src={img} alt={`Evidência ${index + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        evidencias: prev.evidencias?.filter((_, i) => i !== index)
                                                    }));
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse md:flex-row justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => setViewMode('LIST')}
                                className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Save size={20} />
                                Salvar Registro
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {viewMode === 'ANALYSIS' && selectedOcorrencia && (
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-indigo-900 p-8 flex justify-between items-center text-white">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setViewMode('LIST')} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition">
                                <ChevronRight className="rotate-180" size={24} />
                            </button>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="bg-indigo-700/50 px-3 py-1 rounded-lg text-xs font-black font-mono">
                                        #{selectedOcorrencia.id.substring(0, 6).toUpperCase()}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedOcorrencia.severidade === 'CRITICA' ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'}`}>
                                        {selectedOcorrencia.severidade}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black tracking-tight">Análise de Causa Raiz</h2>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsCreateProjectOpen(true)}
                                className="bg-white text-indigo-900 px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-lg"
                            >
                                <FolderPlus size={18} />
                                Criar Projeto
                            </button>
                            <button
                                onClick={() => {
                                    setNcToDelete(selectedOcorrencia.id);
                                    setIsDeleteDialogOpen(true);
                                }}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-100 p-3 rounded-2xl transition border border-red-500/20"
                            >
                                <Trash2 size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                        {/* Sidebar: Details */}
                        <div className="lg:col-span-4 p-8 bg-slate-50 border-r border-slate-100 space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Informações da NC</h3>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-lg font-black text-slate-800 leading-tight">{selectedOcorrencia.titulo}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-lg">{selectedOcorrencia.tipo}</span>
                                            <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-lg">{selectedOcorrencia.origem}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descrição</p>
                                        <p className="text-slate-600 font-medium leading-relaxed bg-white p-4 rounded-2xl border border-slate-200 shadow-sm max-h-48 overflow-y-auto italic">
                                            "{selectedOcorrencia.descricao}"
                                        </p>
                                    </div>
                                    {selectedOcorrencia.acao_contencao && (
                                        <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 shadow-sm">
                                            <p className="text-xs font-black text-orange-800 uppercase tracking-widest mb-2">Contenção Efetuada</p>
                                            <p className="text-orange-950 font-bold text-sm">
                                                {selectedOcorrencia.acao_contencao}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedOcorrencia.evidencias && selectedOcorrencia.evidencias.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Evidências Visuais</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedOcorrencia.evidencias.map((img, idx) => (
                                            <div
                                                key={idx}
                                                className="aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white cursor-zoom-in hover:scale-105 transition-transform"
                                                onClick={() => window.open(img, '_blank')}
                                            >
                                                <img src={img} alt="NC evidence" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Analysis Body */}
                        <div className="lg:col-span-8 p-8">
                            <div className="max-w-2xl mx-auto">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-600/20">5</div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Análise dos 5 Porquês</h3>
                                        <p className="text-slate-500 font-medium">Aprofunde na causa até encontrar a origem sistêmica.</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSaveAnalysis} className="space-y-6">
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <div key={num} className="relative pl-14 pb-4">
                                            {num < 5 && <div className="absolute left-[27px] top-10 w-1 h-full bg-slate-100 rounded-full"></div>}
                                            <div className="absolute left-0 top-1 w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 text-slate-300 font-black flex items-center justify-center z-10 text-lg shadow-sm group-focus-within:border-indigo-500 group-focus-within:text-indigo-500 transition-all">
                                                {num}
                                            </div>
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                                    {num}º Por Que?
                                                </label>
                                                <input
                                                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-lg transition-all outline-none font-medium text-slate-700"
                                                    placeholder={num === 1 ? "Por que este problema foi gerado?" : "O que causou o porquê anterior?"}
                                                    value={(fiveWhys as any)[`pq${num}`]}
                                                    onChange={e => setFiveWhys({ ...fiveWhys, [`pq${num}`]: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="mt-10 p-8 bg-green-50 rounded-3xl border-2 border-dashed border-green-200">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                                            <h4 className="text-sm font-black text-green-900 uppercase tracking-widest">Causa Raiz Sistêmica</h4>
                                        </div>
                                        <textarea
                                            className="w-full px-6 py-4 bg-white border border-green-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 text-lg font-bold text-green-900 shadow-sm outline-none transition-all"
                                            placeholder="Descreva aqui o erro de processo ou sistema identificado..."
                                            rows={2}
                                            required
                                            value={fiveWhys.causa_raiz}
                                            onChange={e => setFiveWhys({ ...fiveWhys, causa_raiz: e.target.value })}
                                        />
                                        <p className="text-[10px] text-green-700 mt-4 font-bold uppercase tracking-tight text-center">
                                            * Esta causa será utilizada para o plano de ação corretiva.
                                        </p>
                                    </div>

                                    <div className="flex justify-end pt-8">
                                        <button
                                            type="submit"
                                            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                                        >
                                            <CheckCircle size={20} />
                                            Salvar & Criar Plano de Ação
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* UX Support Components */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                title="Excluir Registro principal?"
                message="Esta ação é irreversível e removerá todos os dados desta Não Conformidade, incluindo análises e planos vinculados."
                confirmText="Sim, excluir permanentemente"
                cancelText="Mantenha o registro"
                onConfirm={() => ncToDelete && handleDeleteNC(ncToDelete)}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setNcToDelete(null);
                }}
            />

            {isCreateProjectOpen && selectedOcorrencia && (
                <CriarProjetoModal
                    ncId={selectedOcorrencia.id}
                    ncTitulo={selectedOcorrencia.titulo}
                    onClose={() => setIsCreateProjectOpen(false)}
                    onSuccess={() => {
                        // Success toast handled inside modal
                    }}
                />
            )}

            {/* FAB for Mobile */}
            {viewMode === 'LIST' && (
                <div className="md:hidden">
                    <FAB
                        onClick={() => setViewMode('FORM')}
                        label="Novo Registro"
                        icon={<Plus size={24} />}
                    />
                </div>
            )}
        </div>
    );
};

export default NaoConformidades;
