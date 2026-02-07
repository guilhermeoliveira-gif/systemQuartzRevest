
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus, Search, Filter, CheckCircle, Clock, XCircle, FileText, ChevronRight, Save, ShieldAlert, Upload, Image as ImageIcon } from 'lucide-react';
import { NaoConformidade } from '../types_nc';
import { qualidadeService } from '../services/qualidadeService';

const NaoConformidades: React.FC = () => {
    const navigate = useNavigate();

    // State
    const [ocorrencias, setOcorrencias] = useState<NaoConformidade[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'ANALYSIS'>('LIST');
    const [selectedOcorrencia, setSelectedOcorrencia] = useState<NaoConformidade | null>(null);

    // Form State for new entry
    const [formData, setFormData] = useState<Partial<NaoConformidade>>({
        severidade: 'MEDIA',
        tipo: 'PROCESSO',
        data_ocorrencia: new Date().toISOString().split('T')[0],
        acao_contencao: '',
        evidencias: []
    });

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
            // Save analysis to database
            await qualidadeService.saveAnaliseCausa(selectedOcorrencia.id, fiveWhys);

            // Reload data
            await loadNaoConformidades();

            // Redirect to Action Plan creation
            navigate(`/qualidade/planos-acao?nc_id=${selectedOcorrencia.id}&nc_title=${encodeURIComponent(selectedOcorrencia.titulo)}`);
        } catch (error) {
            console.error('Erro ao salvar análise:', error);
            alert('Erro ao salvar análise. Tente novamente.');
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

            await qualidadeService.createNaoConformidade(newEntry);

            // Reload data
            await loadNaoConformidades();

            // Reset form
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
            alert('Erro ao criar não conformidade. Tente novamente.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Carregando não conformidades...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="text-red-600" />
                    Gestão de Não Conformidades
                </h1>
                <p className="text-slate-500">RNC - Registro, Análise de Causa Raiz e Planos de Ação (5W2H)</p>
            </div>

            {viewMode === 'LIST' && (
                <>
                    {/* Controls */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Buscar ocorrência..."
                            />
                        </div>
                        <button
                            onClick={() => setViewMode('FORM')}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition shadow-sm font-medium"
                        >
                            <Plus size={20} />
                            Nova Ocorrência
                        </button>
                    </div>

                    {/* List */}
                    <div className="grid gap-4">
                        {ocorrencias.map(oc => (
                            <div
                                key={oc.id}
                                onClick={() => handleOpenAnalysis(oc)}
                                className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${oc.severidade === 'CRITICA' ? 'bg-red-100 text-red-700' :
                                            oc.severidade === 'ALTA' ? 'bg-orange-100 text-orange-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {oc.severidade}
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">#{oc.id.substring(0, 6).toUpperCase()}</span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <Clock size={12} /> {new Date(oc.data_ocorrencia).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{oc.titulo}</h3>
                                    <p className="text-slate-500 text-sm mt-1">{oc.origem} • {oc.tipo}</p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">Status</div>
                                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                                            {oc.status === 'EM_ANALISE' && <Search size={14} />}
                                            {oc.status === 'ACAO_DEFINIDA' && <CheckCircle size={14} className="text-green-600" />}
                                            {oc.status.replace('_', ' ')}
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {viewMode === 'FORM' && (
                /* Form Mode */
                <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 animate-in slide-in-from-right-4">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-800">Registrar Não Conformidade</h2>
                        <button onClick={() => setViewMode('LIST')} className="text-slate-400 hover:text-slate-600">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6 pb-20 md:pb-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Título da Ocorrência</label>
                                <input
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base"
                                    placeholder="Resumo do problema (Ex: Vazamento no Moinho 3)"
                                    required
                                    value={formData.titulo}
                                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Origem / Local</label>
                                <input
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 text-base"
                                    placeholder="Onde aconteceu?"
                                    required
                                    value={formData.origem}
                                    onChange={e => setFormData({ ...formData, origem: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Data da Ocorrência</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 text-base"
                                    required
                                    value={formData.data_ocorrencia}
                                    onChange={e => setFormData({ ...formData, data_ocorrencia: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Problema</label>
                                <select
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 bg-white text-base"
                                    value={formData.tipo}
                                    onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                                >
                                    <option value="PROCESSO">Falha de Processo</option>
                                    <option value="PRODUTO">Defeito em Produto</option>
                                    <option value="SEGURANCA">Segurança / EPI</option>
                                    <option value="AMBIENTAL">Ambiental</option>
                                    <option value="OUTROS">Outros</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Severidade Estimada</label>
                                <div className="grid grid-cols-2 md:flex gap-2">
                                    {['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'].map(sev => (
                                        <button
                                            type="button"
                                            key={sev}
                                            onClick={() => setFormData({ ...formData, severidade: sev as any })}
                                            className={`flex-1 py-3 px-4 text-sm font-bold rounded-lg border transition-all ${formData.severidade === sev
                                                ? (sev === 'CRITICA' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-800 text-white border-slate-800')
                                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            {sev}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Descrição Detalhada do Problema (O Que e Como)</label>
                                <textarea
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 h-32 text-base"
                                    placeholder="Descreva o que aconteceu com o máximo de detalhes possível..."
                                    required
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                />

                            </div>

                            <div className="col-span-1 md:col-span-2 bg-orange-50 p-4 rounded-lg border border-orange-100">
                                <label className="block text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
                                    <ShieldAlert size={18} />
                                    Ação de Contenção Imediata (Bloqueio)
                                </label>
                                <p className="text-xs text-orange-600 mb-3">O que foi feito *agora* para parar o problema/acidente? (Ex: Parar máquina, segregar lote)</p>
                                <textarea
                                    className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white text-base"
                                    placeholder="Descreva a ação imediata..."
                                    required
                                    value={formData.acao_contencao}
                                    onChange={e => setFormData({ ...formData, acao_contencao: e.target.value })}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                    <ImageIcon size={18} className="text-slate-400" />
                                    Evidências (Fotos do Problema)
                                </label>

                                <div className="space-y-4">
                                    {/* Photo Input Area */}
                                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition cursor-pointer min-h-[120px] relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                                            <div className="bg-blue-100 p-3 rounded-full text-blue-600 mb-1">
                                                <Upload size={24} />
                                            </div>
                                            <p className="font-bold text-slate-700 text-center">Tirar Foto ou Upload</p>
                                            <p className="text-xs text-slate-400 text-center">Toque para abrir a câmera</p>
                                        </div>
                                    </div>

                                    {/* Preview Area */}
                                    {formData.evidencias && formData.evidencias.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            {formData.evidencias.map((img, index) => (
                                                <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-black">
                                                    <img src={img} alt={`Evidência ${index + 1}`} className="w-full h-full object-contain" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                evidencias: prev.evidencias?.filter((_, i) => i !== index)
                                                            }));
                                                        }}
                                                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-md opacity-90 hover:opacity-100"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                            <button
                                type="button"
                                onClick={() => setViewMode('LIST')}
                                className="w-full md:w-auto px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg border md:border-0 border-slate-200"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="w-full md:w-auto px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Registrar RNC
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {viewMode === 'ANALYSIS' && selectedOcorrencia && (
                <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 animate-in slide-in-from-right-4">
                    <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100">
                        <div>
                            <button onClick={() => setViewMode('LIST')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium mb-2">
                                <ChevronRight className="rotate-180" size={16} />
                                Voltar para Lista
                            </button>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                <span className="bg-slate-100 px-2 py-1 rounded text-sm font-mono text-slate-500 border border-slate-200">
                                    #{selectedOcorrencia.id.substring(0, 6).toUpperCase()}
                                </span>
                                Análise de Causa Raiz
                            </h2>
                        </div>
                        <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedOcorrencia.severidade === 'CRITICA' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                {selectedOcorrencia.severidade}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Context Details */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-blue-600" />
                                    Detalhes da Ocorrência
                                </h3>

                                <div className="space-y-4 text-sm">
                                    <div>
                                        <label className="text-slate-400 font-medium text-xs uppercase tracking-wider">Título</label>
                                        <p className="font-medium text-slate-800">{selectedOcorrencia.titulo}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-slate-400 font-medium text-xs uppercase tracking-wider">Tipo</label>
                                            <p className="font-medium text-slate-800">{selectedOcorrencia.tipo}</p>
                                        </div>
                                        <div>
                                            <label className="text-slate-400 font-medium text-xs uppercase tracking-wider">Data</label>
                                            <p className="font-medium text-slate-800">{new Date(selectedOcorrencia.data_ocorrencia).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-slate-400 font-medium text-xs uppercase tracking-wider">Origem / Local</label>
                                        <p className="font-medium text-slate-800">{selectedOcorrencia.origem}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-slate-400 font-medium text-xs uppercase tracking-wider">Responsável</label>
                                            <p className="font-medium text-slate-800">{selectedOcorrencia.responsavel_id}</p>
                                        </div>
                                        <div>
                                            <label className="text-slate-400 font-medium text-xs uppercase tracking-wider">Status Atual</label>
                                            <p className="font-medium text-slate-800 flex items-center gap-1">
                                                {selectedOcorrencia.status === 'EM_ANALISE' ? <Search size={12} /> : <CheckCircle size={12} />}
                                                {selectedOcorrencia.status.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-slate-400 font-medium text-xs uppercase tracking-wider">Descrição</label>
                                        <p className="text-slate-600 leading-relaxed bg-white p-3 rounded border border-slate-200 mt-1 max-h-40 overflow-y-auto">
                                            {selectedOcorrencia.descricao}
                                        </p>
                                    </div>
                                </div>

                                {selectedOcorrencia.acao_contencao && (
                                    <div className="bg-orange-50 p-3 rounded border border-orange-100 mt-2">
                                        <label className="text-orange-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1 mb-1">
                                            <ShieldAlert size={12} /> Ação de Contenção
                                        </label>
                                        <p className="text-orange-900 font-medium leading-tight">
                                            {selectedOcorrencia.acao_contencao}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Right Column: 5 Whys Methodology */}
                        <div className="lg:col-span-2">
                            <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold font-serif">5</div>
                                        Metodologia dos 5 Porquês
                                    </h3>
                                    <p className="text-slate-600 text-sm mt-1">
                                        Pergunte "Por quê?" sucessivamente até encontrar a causa raiz do problema.
                                    </p>
                                </div>

                                <form onSubmit={handleSaveAnalysis} className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <div key={num} className="relative pl-8">
                                            {/* Connecting Line */}
                                            {num < 5 && (
                                                <div className="absolute left-[15px] top-8 w-0.5 h-full bg-slate-200 z-0"></div>
                                            )}
                                            {/* Number Bubble */}
                                            <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-400 font-bold flex items-center justify-center z-10 text-sm shadow-sm">
                                                {num}
                                            </div>

                                            <div className="relative">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                    {num}º Por Que?
                                                </label>
                                                <input
                                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                                                    placeholder={num === 1 ? "Por que o problema aconteceu?" : "Por que a causa anterior aconteceu?"}
                                                    value={(fiveWhys as any)[`pq${num}`]}
                                                    onChange={e => setFiveWhys({ ...fiveWhys, [`pq${num}`]: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-6 mt-6 border-t border-blue-100">
                                        <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            Causa Raiz Identificada
                                        </label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-green-50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 text-slate-800 font-medium"
                                            placeholder="Descreva a conclusão final da causa raiz..."
                                            rows={2}
                                            required
                                            value={fiveWhys.causa_raiz}
                                            onChange={e => setFiveWhys({ ...fiveWhys, causa_raiz: e.target.value })}
                                        />
                                        <p className="text-xs text-slate-500 mt-2">
                                            * A causa raiz deve ser algo sobre o qual tenhamos controle para modificar.
                                        </p>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition flex items-center gap-2"
                                        >
                                            <CheckCircle size={18} />
                                            Salvar Análise de Causa
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default NaoConformidades;
