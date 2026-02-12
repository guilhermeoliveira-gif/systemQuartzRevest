import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { checklistService } from '../../services/checklistService';
import { ChecklistAgendamento, ChecklistItemModelo, ChecklistExecucao as IChecklistExecucao } from '../../types_checklist';
import { Camera, CheckCircle2, XCircle, ChevronRight, AlertTriangle, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const ChecklistExecucao: React.FC = () => {
    const { agendamentoId } = useParams<{ agendamentoId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [agendamento, setAgendamento] = useState<ChecklistAgendamento | null>(null);
    const [execucao, setExecucao] = useState<IChecklistExecucao | null>(null);
    const [itens, setItens] = useState<ChecklistItemModelo[]>([]);

    // Estado local das respostas
    const [respostas, setRespostas] = useState<Record<string, { conforme: boolean | null, obs: string, foto: File | null }>>({});

    useEffect(() => {
        if (agendamentoId) loadExecucao();
    }, [agendamentoId]);

    const loadExecucao = async () => {
        try {
            setLoading(true);
            // 1. Carregar Agendamento e Modelo
            const ags = await checklistService.getAgendamentos(); // Idealmente getById
            const ag = ags.find(a => a.id === agendamentoId);

            if (!ag) throw new Error('Agendamento não encontrado');
            setAgendamento(ag);

            // 2. Carregar Itens do Modelo
            const modelos = await checklistService.getModelos();
            const modelo = modelos.find(m => m.id === ag.modelo_id);
            if (modelo && modelo.itens) {
                setItens(modelo.itens.sort((a, b) => a.ordem - b.ordem));
            }

            // 3. Iniciar Execução (backend)
            // TODO: Pegar ID do usuário logado
            const userId = 'c13327d0-7d72-4632-841d-384196165243';
            const exec = await checklistService.iniciarExecucao(agendamentoId!, userId);
            setExecucao(exec);

        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar execução', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleResposta = (itemId: string, conforme: boolean) => {
        setRespostas(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], conforme }
        }));
    };

    const handleObs = (itemId: string, obs: string) => {
        setRespostas(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], obs }
        }));
    };

    const handleFoto = (itemId: string, file: File) => {
        setRespostas(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], foto: file }
        }));
    };

    const finalizarChecklist = async () => {
        if (!execucao || !agendamento) return;

        // Validar se todos os obrigatórios foram respondidos
        const naoRespondidos = itens.filter(i => i.obrigatorio && respostas[i.id]?.conforme === undefined);
        if (naoRespondidos.length > 0) {
            showToast(`Responda todos os itens obrigatórios (${naoRespondidos.length} restantes)`, { type: 'warning' });
            return;
        }

        try {
            setLoading(true);

            // Enviar respostas uma a uma
            for (const item of itens) {
                const resp = respostas[item.id];
                if (!resp) continue;

                let fotoUrl = undefined;
                if (resp.foto) {
                    const fileName = `${execucao.id}/${item.id}-${Date.now()}.jpg`;
                    const { data, error } = await supabase.storage
                        .from('evidencias-checklist') // Bucket precisa existir
                        .upload(fileName, resp.foto);

                    if (!error && data) {
                        const { data: publicUrl } = supabase.storage.from('evidencias-checklist').getPublicUrl(fileName);
                        fotoUrl = publicUrl.publicUrl;
                    }
                }

                await checklistService.salvarResposta({
                    execucao_id: execucao.id,
                    item_modelo_id: item.id,
                    conforme: resp.conforme === true, // Forçar booleano
                    valor_texto: resp.obs,
                    foto_url: fotoUrl
                }, item, agendamento.entidade_id || 'N/A');
            }

            await checklistService.finalizarExecucao(execucao.id, agendamento.id);
            showToast('Checklist finalizado com sucesso!', { type: 'success' });
            navigate('/checklist/agendamento');

        } catch (error) {
            console.error(error);
            showToast('Erro ao finalizar checklist', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando checklist...</div>;
    if (!agendamento) return <div className="p-8 text-center text-red-500">Agendamento inválido</div>;

    return (
        <div className="max-w-3xl mx-auto bg-slate-50 min-h-screen pb-20">
            {/* Header Fixo Mobile */}
            <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600">
                    <ArrowLeft />
                </button>
                <div>
                    <h1 className="font-bold text-slate-800 text-lg leading-tight">{agendamento.modelo?.nome}</h1>
                    <p className="text-xs text-slate-500 font-mono">ID: {agendamento.id.slice(0, 8)}</p>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {itens.map((item, index) => {
                    const resp = respostas[item.id] || {};
                    const isNaoConforme = resp.conforme === false;

                    return (
                        <div key={item.id} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all ${isNaoConforme ? 'border-red-200' :
                            resp.conforme === true ? 'border-green-200' : 'border-transparent'
                            }`}>
                            <div className="p-4">
                                <span className="text-xs font-bold text-slate-400 mb-1 block">ITEM {index + 1}</span>
                                <p className="font-medium text-slate-800 text-lg mb-4">{item.texto}</p>

                                {/* Botões de Ação */}
                                <div className="flex gap-3 mb-4">
                                    <button
                                        onClick={() => handleResposta(item.id, true)}
                                        className={`flex-1 py-3 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-colors ${resp.conforme === true
                                            ? 'bg-green-600 text-white'
                                            : 'bg-slate-100 text-slate-400 hover:bg-green-50 hover:text-green-600'
                                            }`}>
                                        <CheckCircle2 size={24} />
                                        <span>Conforme</span>
                                    </button>

                                    <button
                                        onClick={() => handleResposta(item.id, false)}
                                        className={`flex-1 py-3 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-colors ${resp.conforme === false
                                            ? 'bg-red-600 text-white'
                                            : 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600'
                                            }`}>
                                        <XCircle size={24} />
                                        <span>Não Conforme</span>
                                    </button>
                                </div>

                                {/* Área de Não Conformidade */}
                                {isNaoConforme && (
                                    <div className="bg-red-50 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-start gap-2 text-red-700 text-sm font-bold mb-3">
                                            <AlertTriangle size={16} className="mt-0.5" />
                                            <p>Atenção: Uma Não Conformidade (NC) e ordem de serviço serão geradas automaticamente.</p>
                                        </div>

                                        <textarea
                                            placeholder="Descreva o problema (Obrigatório)..."
                                            className="w-full p-3 rounded border border-red-200 text-sm focus:ring-red-500 mb-3"
                                            rows={3}
                                            value={resp.obs || ''}
                                            onChange={e => handleObs(item.id, e.target.value)}
                                        />

                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-red-600 text-sm font-bold cursor-pointer hover:bg-red-50">
                                                <Camera size={18} />
                                                Adicionar Foto
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={e => e.target.files && handleFoto(item.id, e.target.files[0])}
                                                />
                                            </label>
                                            {resp.foto && <span className="text-xs text-slate-500 truncate max-w-[150px]">{resp.foto.name}</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Fixo */}
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t shadow-lg flex justify-between items-center z-10 md:pl-64">
                <div className="text-xs text-slate-500">
                    {Object.keys(respostas).length} de {itens.length} respondidos
                </div>
                <button
                    onClick={finalizarChecklist}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all hover:scale-105"
                >
                    <Save size={20} /> Finalizar Checklist
                </button>
            </div>
        </div>
    );
};

export default ChecklistExecucao;
