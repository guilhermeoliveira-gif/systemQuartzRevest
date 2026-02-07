
import React, { useState } from 'react';
import { X, Save, Wrench, Clock, AlertTriangle, CheckSquare } from 'lucide-react';
import { Button } from '../ui/Button';
import { manutencaoService } from '../../services/manutencaoService';
import { StatusOS, TipoManutencao, PrioridadeOS } from '../../types_manutencao';
import { useToast } from '../../contexts/ToastContext';

interface OSModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (osId: string) => void;
    maquinaId: string;
    maquinaNome: string;
    taskTitle?: string;
}

const OSModal: React.FC<OSModalProps> = ({ isOpen, onClose, onSuccess, maquinaId, maquinaNome, taskTitle }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        tipo: 'Corretiva' as TipoManutencao,
        prioridade: 'Média' as PrioridadeOS,
        descricao: taskTitle ? `Execução de tarefa: ${taskTitle}` : '',
        causa_problema: '',
        solucao_aplicada: '',
        horas_maquina_na_os: 0,
        custo_total: 0
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const os = await manutencaoService.createOS({
                ...formData,
                maquina_id: maquinaId,
                status: 'Concluída',
                data_abertura: new Date().toISOString(),
                data_inicio: new Date().toISOString(),
                data_conclusao: new Date().toISOString(),
            });

            toast.success('OS Registrada', 'Os dados de manutenção foram salvos com sucesso.');
            onSuccess(os.id);
            onClose();
        } catch (error) {
            toast.error('Erro', 'Falha ao registrar OS.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 scale-100 animate-in zoom-in-95 duration-300">
                <header className="bg-orange-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black flex items-center gap-2">
                            <Wrench size={24} /> Registro de Manutenção (OS)
                        </h2>
                        <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest mt-1">Ativo: {maquinaNome}</p>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Intervenção</label>
                            <select
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-bold text-slate-700 appearance-none"
                                value={formData.tipo}
                                onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                            >
                                <option value="Preventiva">🔧 Preventiva (Programada)</option>
                                <option value="Corretiva">🚨 Corretiva (Falha)</option>
                                <option value="Preditiva">📊 Preditiva (Análise)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prioridade</label>
                            <select
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-bold text-slate-700 appearance-none"
                                value={formData.prioridade}
                                onChange={e => setFormData({ ...formData, prioridade: e.target.value as any })}
                            >
                                <option value="Baixa">Baixa</option>
                                <option value="Média">Média</option>
                                <option value="Alta">Alta</option>
                                <option value="Urgente">Urgente</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição do Problema / Atividade</label>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-medium text-slate-700 h-20"
                                placeholder="..."
                                required
                                value={formData.descricao}
                                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-orange-600">Solução Aplicada / Registro Técnico</label>
                            <textarea
                                className="w-full px-4 py-3 bg-white border-2 border-orange-100 rounded-xl focus:ring-4 focus:orange-500/10 focus:border-orange-500 outline-none font-medium text-slate-700 h-24 shadow-sm"
                                placeholder="Descreva tecnicamente o que foi feito..."
                                required
                                value={formData.solucao_aplicada}
                                onChange={e => setFormData({ ...formData, solucao_aplicada: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Horímetro Atual (Horas)</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-bold text-slate-700"
                                    value={formData.horas_maquina_na_os}
                                    onChange={e => setFormData({ ...formData, horas_maquina_na_os: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Custo Total Est. (R$)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input
                                    type="number"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-bold text-slate-700"
                                    value={formData.custo_total}
                                    onChange={e => setFormData({ ...formData, custo_total: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button variant="ghost" type="button" onClick={onClose} className="px-8 py-3 font-black uppercase tracking-widest text-slate-400">Pular (Não Recomendado)</Button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-orange-600 text-white px-10 py-3 rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            {loading ? 'SALVANDO...' : 'FINALIZAR & SALVAR OS'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OSModal;
