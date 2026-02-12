import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Clock, Calendar, Wrench, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { manutencaoService } from '../../services/manutencaoService';
import { ManutencaoPlano, ManutencaoPlanoItem } from '../../types_manutencao';
import { useToast } from '../../contexts/ToastContext';

const ManutencaoPlanosAdmin: React.FC = () => {
    const [planos, setPlanos] = useState<(ManutencaoPlano & { itens: ManutencaoPlanoItem[] })[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showVincularModal, setShowVincularModal] = useState(false);
    const [selectedPlano, setSelectedPlano] = useState<ManutencaoPlano | null>(null);
    const [maquinas, setMaquinas] = useState<any[]>([]);
    const [selectedMaquinaId, setSelectedMaquinaId] = useState('');
    const { showToast } = useToast();

    // Estado para novo plano
    const [newPlano, setNewPlano] = useState<Partial<ManutencaoPlano>>({ nome: '', descricao: '', ativo: true });
    const [newItens, setNewItens] = useState<Partial<ManutencaoPlanoItem>[]>([
        { tarefa: '', periodicidade_horas: 250, periodicidade_dias: 0 }
    ]);

    useEffect(() => {
        loadData();
        loadMaquinas();
    }, []);

    const loadMaquinas = async () => {
        try {
            const data = await manutencaoService.getMaquinas();
            setMaquinas(data);
        } catch (error) {
            console.error(error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await manutencaoService.getPlanos();
            setPlanos(data);
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar planos', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleVincular = async () => {
        if (!selectedPlano || !selectedMaquinaId) return;
        try {
            await manutencaoService.vincularPlanoMaquina(selectedMaquinaId, selectedPlano.id);
            showToast('Máquina vinculada ao plano!', { type: 'success' });
            setShowVincularModal(false);
            setSelectedMaquinaId('');
        } catch (error) {
            console.error(error);
            showToast('Erro ao vincular máquina', { type: 'error' });
        }
    };

    const addItem = () => {
        setNewItens([...newItens, { tarefa: '', periodicidade_horas: 0, periodicidade_dias: 0 }]);
    };

    const removeItem = (index: number) => {
        setNewItens(newItens.filter((_, i) => i !== index));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlano.nome || newItens.some(i => !i.tarefa)) {
            showToast('Preencha o nome e todas as tarefas', { type: 'warning' });
            return;
        }

        try {
            await manutencaoService.createPlano(newPlano, newItens);
            showToast('Plano criado com sucesso!', { type: 'success' });
            setShowModal(false);
            setNewPlano({ nome: '', descricao: '', ativo: true });
            setNewItens([{ tarefa: '', periodicidade_horas: 250, periodicidade_dias: 0 }]);
            loadData();
        } catch (error) {
            console.error(error);
            showToast('Erro ao salvar plano', { type: 'error' });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <Link to="/manutencao/preventiva" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Planos de Manutenção</h1>
                        <p className="text-slate-500">Configure roteiros e periodicidades padrão.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    <Plus size={18} /> Novo Plano
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400 font-medium">Carregando roteiros...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {planos.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                            Nenhum plano configurado. Crie seu primeiro roteiro de manutenção.
                        </div>
                    ) : planos.map(plano => (
                        <div key={plano.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-50">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{plano.nome}</h3>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plano.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                                        {plano.ativo ? 'ATIVO' : 'INATIVO'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2">{plano.descricao || 'Sem descrição adicional.'}</p>
                            </div>

                            <div className="flex-1 bg-slate-50/50 p-6 space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                    <Wrench size={12} /> Roteiro de Tarefas ({plano.itens.length})
                                </h4>
                                {plano.itens.map(item => (
                                    <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                            <span className="text-sm font-medium text-slate-700">{item.tarefa}</span>
                                        </div>
                                        <div className="flex gap-3 text-[10px] font-bold">
                                            {item.periodicidade_horas > 0 && (
                                                <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded italic">
                                                    <Clock size={10} /> {item.periodicidade_horas}h
                                                </span>
                                            )}
                                            {item.periodicidade_dias > 0 && (
                                                <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded italic">
                                                    <Calendar size={10} /> {item.periodicidade_dias}d
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white">
                                <button
                                    onClick={() => {
                                        setSelectedPlano(plano);
                                        setShowVincularModal(true);
                                    }}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                                >
                                    <Plus size={14} /> Vincular Máquina
                                </button>
                                <div className="flex gap-2">
                                    <button className="text-xs font-bold text-slate-400 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">Editar</button>
                                    <button className="text-xs font-bold text-slate-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Excluir</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Novo Plano */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Novo Plano de Manutenção</h2>
                                <p className="text-xs text-slate-500">Defina o nome e as tarefas periódicas.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full">
                                <Plus className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-auto p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Plano *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ex: Revisão Preventiva Tier 1"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newPlano.nome}
                                        onChange={e => setNewPlano({ ...newPlano, nome: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição Curta</label>
                                    <input
                                        type="text"
                                        placeholder="Para quais máquinas se aplica?"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newPlano.descricao}
                                        onChange={e => setNewPlano({ ...newPlano, descricao: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tarefas do Plano</h3>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Adicionar Tarefa
                                    </button>
                                </div>

                                {newItens.map((item, idx) => (
                                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
                                        <div className="flex-1 w-full">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome da Tarefa</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Ex: Troca de Filtro de Combustível"
                                                className="w-full px-4 py-2 border rounded-lg bg-white outline-none focus:border-blue-500"
                                                value={item.tarefa}
                                                onChange={e => {
                                                    const updated = [...newItens];
                                                    updated[idx].tarefa = e.target.value;
                                                    setNewItens(updated);
                                                }}
                                            />
                                        </div>
                                        <div className="w-full md:w-32">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">A cada (Horas)</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 border rounded-lg bg-white outline-none focus:border-blue-500"
                                                value={item.periodicidade_horas}
                                                onChange={e => {
                                                    const updated = [...newItens];
                                                    updated[idx].periodicidade_horas = Number(e.target.value);
                                                    setNewItens(updated);
                                                }}
                                            />
                                        </div>
                                        <div className="w-full md:w-32">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">A cada (Dias)</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 border rounded-lg bg-white outline-none focus:border-blue-500"
                                                value={item.periodicidade_dias}
                                                onChange={e => {
                                                    const updated = [...newItens];
                                                    updated[idx].periodicidade_dias = Number(e.target.value);
                                                    setNewItens(updated);
                                                }}
                                            />
                                        </div>
                                        {newItens.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </form>

                        <div className="p-6 border-t bg-slate-50 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-transform active:scale-95"
                            >
                                Salvar Plano
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Vincular Máquina */}
            {showVincularModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Vincular Máquina</h2>
                            <button onClick={() => setShowVincularModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <Plus className="rotate-45" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500">
                            Selecione a máquina que seguirá o plano: <br />
                            <strong className="text-blue-600">{selectedPlano?.nome}</strong>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Máquina</label>
                                <select
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedMaquinaId}
                                    onChange={e => setSelectedMaquinaId(e.target.value)}
                                >
                                    <option value="">Selecione uma máquina...</option>
                                    {maquinas.map(m => (
                                        <option key={m.id} value={m.id}>{m.nome} - {m.modelo}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setShowVincularModal(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleVincular}
                                    disabled={!selectedMaquinaId}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Confirmar Vínculo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManutencaoPlanosAdmin;
