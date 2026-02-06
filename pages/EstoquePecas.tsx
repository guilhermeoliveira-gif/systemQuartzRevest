
import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { MecanicaInsumo } from '../types';
import { Plus, Search, Wrench, Package, ArrowUp, ArrowDown, Trash2, MapPin, AlertCircle, X } from 'lucide-react';

const EstoquePecas: React.FC = () => {
    const [pecas, setPecas] = useState<MecanicaInsumo[]>([]);
    const [filter, setFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [customCategoryMode, setCustomCategoryMode] = useState(false);

    // Dynamic Categories
    const availableCategories = React.useMemo(() => {
        const cats = new Set(pecas.map(p => p.categoria));
        cats.add('PECA');
        cats.add('INSUMO');
        return Array.from(cats).sort();
    }, [pecas]);

    // Modal de Movimentação
    const [moveModal, setMoveModal] = useState<{
        open: boolean,
        type: 'ENTRADA' | 'SAIDA',
        item: MecanicaInsumo | null
    }>({ open: false, type: 'ENTRADA', item: null });

    const [moveQty, setMoveQty] = useState('');
    const [moveReason, setMoveReason] = useState('');

    const [itemsLoading, setItemsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // New Item Form State
    const [newItem, setNewItem] = useState<Partial<MecanicaInsumo>>({
        nome: '',
        categoria: 'PECA',
        sub_categoria: '',
        maquina_uso: '',
        unidade_medida: 'un',
        quantidade_atual: 0,
        minimo_seguranca: 0,
        localizacao: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setItemsLoading(true);
        try {
            const data = await store.getPecas();
            setPecas(data);
        } catch (error) {
            console.error(error);
        } finally {
            setItemsLoading(false);
        }
    };

    const showFeedback = (type: 'success' | 'error', text: string) => {
        setFeedback({ type, text });
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newItem.nome) {
            setSubmitting(true);
            try {
                if (newItem.id) {
                    // Update existing
                    await store.updatePeca(newItem.id, newItem);
                    showFeedback('success', 'Item atualizado com sucesso!');
                } else {
                    // Create new
                    await store.addPeca(newItem as Omit<MecanicaInsumo, 'id'>);
                    showFeedback('success', 'Item cadastrado com sucesso!');
                }

                setCustomCategoryMode(false);
                setIsFormOpen(false);
                setNewItem({
                    nome: '',
                    categoria: 'PECA',
                    sub_categoria: '',
                    maquina_uso: '',
                    unidade_medida: 'un',
                    quantidade_atual: 0,
                    minimo_seguranca: 0,
                    localizacao: ''
                });
                await loadData();
            } catch (e) {
                console.error(e);
                showFeedback('error', 'Erro ao salvar item.');
            } finally {
                setSubmitting(false);
            }
        }
    };

    const openEdit = (item: MecanicaInsumo) => {
        setNewItem({ ...item });
        setCustomCategoryMode(false);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openMoveModal = (item: MecanicaInsumo, type: 'ENTRADA' | 'SAIDA') => {
        setMoveModal({ open: true, type, item });
        setMoveQty('');
        setMoveReason('');
    };

    const handleMoveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (moveModal.item && moveQty) {
            setSubmitting(true);
            try {
                await store.registerMovimentacaoPeca(
                    moveModal.item.id,
                    moveModal.type,
                    Number(moveQty),
                    moveReason || (moveModal.type === 'ENTRADA' ? 'Compra/Reposição' : 'Uso Interno'),
                    'CURRENT_USER'
                );

                await loadData();
                window.dispatchEvent(new CustomEvent('STOCK_UPDATED'));

                setMoveModal({ ...moveModal, open: false });
                showFeedback('success', 'Movimentação registrada!');
            } catch (e) {
                console.error(e);
                showFeedback('error', 'Erro ao registrar movimentação.');
            } finally {
                setSubmitting(false);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este item?')) {
            try {
                await store.deletePeca(id);
                loadData();
                showFeedback('success', 'Item removido.');
            } catch (e) {
                showFeedback('error', 'Erro ao remover item.');
            }
        }
    };

    const filteredItems = pecas.filter(item => {
        const matchesSearch = item.nome.toLowerCase().includes(filter.toLowerCase()) ||
            item.localizacao?.toLowerCase().includes(filter.toLowerCase()) ||
            item.maquina_uso?.toLowerCase().includes(filter.toLowerCase()) ||
            item.sub_categoria?.toLowerCase().includes(filter.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || item.categoria === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Wrench className="text-blue-600" />
                        Estoque de Peças e Insumos
                    </h1>
                    <p className="text-slate-500">Gerenciamento de manutenção e almoxarifado</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    Novo Item
                </button>
            </div>

            {/* Feedback Toast */}
            {feedback && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-xl text-white font-bold animate-in slide-in-from-right ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {feedback.text}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, maquina, local..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setCategoryFilter('ALL')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${categoryFilter === 'ALL' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Todos
                    </button>
                    {availableCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${categoryFilter === cat ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Add/Edit Form (Inline) */}
            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">
                        {newItem.id ? 'Editar Item' : 'Novo Registro'}
                    </h3>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Item</label>
                            <input
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={newItem.nome}
                                onChange={e => setNewItem({ ...newItem, nome: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Máquina Relacionada (Opcional)</label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: Moinho 01"
                                value={newItem.maquina_uso}
                                onChange={e => setNewItem({ ...newItem, maquina_uso: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria Principal</label>
                            {!customCategoryMode ? (
                                <select
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={availableCategories.includes(newItem.categoria || '') ? newItem.categoria : '__CUSTOM__'}
                                    onChange={e => {
                                        if (e.target.value === '__CUSTOM__') {
                                            setCustomCategoryMode(true);
                                            setNewItem({ ...newItem, categoria: '' });
                                        } else {
                                            setNewItem({ ...newItem, categoria: e.target.value });
                                        }
                                    }}
                                >
                                    {availableCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    <option value="__CUSTOM__" className="font-bold text-blue-600">+ Nova Categoria...</option>
                                </select>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        required
                                        autoFocus
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Digite a nova categoria..."
                                        value={newItem.categoria}
                                        onChange={e => setNewItem({ ...newItem, categoria: e.target.value.toUpperCase() })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCustomCategoryMode(false);
                                            setNewItem({ ...newItem, categoria: 'PECA' });
                                        }}
                                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                                        title="Voltar para lista"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sub-Categoria</label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Ex: Elétrica, Rolamento"
                                value={newItem.sub_categoria}
                                onChange={e => setNewItem({ ...newItem, sub_categoria: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg"
                                value={newItem.unidade_medida}
                                onChange={e => setNewItem({ ...newItem, unidade_medida: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Inicial</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg"
                                value={newItem.quantidade_atual}
                                onChange={e => setNewItem({ ...newItem, quantidade_atual: Number(e.target.value) })}
                                disabled={!!newItem.id} // Disable stock edit on update, force movement
                                title={newItem.id ? "Use as opções de Entrada/Saída para alterar o estoque" : ""}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Localização</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg"
                                    placeholder="Ex: Prateleira B3"
                                    value={newItem.localizacao}
                                    onChange={e => setNewItem({ ...newItem, localizacao: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFormOpen(false);
                                    setNewItem({
                                        nome: '', category: 'PECA', sub_categoria: '', maquina_uso: '',
                                        unidade_medida: 'un', quantidade_atual: 0, minimo_seguranca: 0, localizacao: ''
                                    } as any);
                                }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {newItem.id ? 'Atualizar Item' : 'Salvar Item'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
                        {/* Status Stripe */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${item.quantidade_atual <= item.minimo_seguranca ? 'bg-red-500' : 'bg-green-500'
                            }`} />

                        <div className="flex justify-between items-start mb-3 pl-2">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${item.categoria === 'PECA' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                                    {item.categoria === 'PECA' ? <Wrench size={20} /> : <Package size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-800 truncate" title={item.nome}>{item.nome}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{item.categoria}</span>
                                        {item.sub_categoria && (
                                            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 rounded border border-slate-200">{item.sub_categoria}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openEdit(item)} className="text-slate-300 hover:text-blue-500 transition-colors" title="Editar">
                                    <Wrench size={16} />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 transition-colors" title="Excluir">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {item.maquina_uso && (
                            <div className="mx-2 mb-2 p-1.5 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700 font-medium flex items-center gap-1">
                                <Wrench size={12} /> Máquina: {item.maquina_uso}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm mb-4 pl-2">
                            <div>
                                <span className="block text-slate-500 text-xs flex items-center gap-1">
                                    <MapPin size={10} /> Localização
                                </span>
                                <span className="font-medium text-slate-700">{item.localizacao || 'Ñ def.'}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500 text-xs">Mínimo</span>
                                <span className="font-medium text-slate-600">{item.minimo_seguranca} {item.unidade_medida}</span>
                            </div>
                        </div>

                        <div className={`flex items-center justify-between p-3 rounded-lg mb-3 mx-2 ${item.quantidade_atual <= item.minimo_seguranca ? 'bg-red-50 border border-red-100' : 'bg-slate-50'
                            }`}>

                            {item.quantidade_atual <= item.minimo_seguranca ? (
                                <div className="flex items-center gap-2 text-red-600">
                                    <AlertCircle size={16} />
                                    <span className="text-xs font-bold uppercase">Baixo Estoque</span>
                                </div>
                            ) : (
                                <span className="text-xs font-semibold text-slate-500 uppercase">Em Estoque</span>
                            )}

                            <span className={`text-xl font-bold ${item.quantidade_atual <= item.minimo_seguranca ? 'text-red-700' : 'text-slate-800'
                                }`}>
                                {item.quantidade_atual} <span className="text-sm font-normal text-slate-500">{item.unidade_medida}</span>
                            </span>
                        </div>

                        <div className="flex gap-2 mx-2">
                            <button
                                onClick={() => openMoveModal(item, 'SAIDA')}
                                className="flex-1 py-1.5 flex items-center justify-center gap-1 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-red-300 hover:text-red-600 text-slate-600 text-sm transition-all"
                            >
                                <ArrowDown size={14} /> Retirar
                            </button>
                            <button
                                onClick={() => openMoveModal(item, 'ENTRADA')}
                                className="flex-1 py-1.5 flex items-center justify-center gap-1 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 text-blue-700 text-sm transition-all shadow-sm"
                            >
                                <ArrowUp size={14} /> Adicionar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Movement Modal */}
            {moveModal.open && moveModal.item && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMoveModal({ ...moveModal, open: false })} />
                    <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            {moveModal.type === 'ENTRADA' ? (
                                <div className="bg-green-100 p-2 rounded-lg text-green-700"><ArrowUp size={24} /></div>
                            ) : (
                                <div className="bg-red-100 p-2 rounded-lg text-red-700"><ArrowDown size={24} /></div>
                            )}
                            {moveModal.type === 'ENTRADA' ? 'Adicionar Estoque' : 'Retirar Peça'}
                        </h3>

                        <div className="mb-4">
                            <p className="text-sm text-slate-500">Item</p>
                            <p className="font-semibold text-slate-800">{moveModal.item.nome}</p>
                            <p className="text-xs text-slate-400">Saldo Atual: {moveModal.item.quantidade_atual} {moveModal.item.unidade_medida}</p>
                        </div>

                        <form onSubmit={handleMoveSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                                <input
                                    className="w-full text-2xl font-bold p-2 border-b-2 border-slate-200 focus:border-blue-600 outline-none bg-transparent"
                                    type="number"
                                    autoFocus
                                    min="1"
                                    step="0.01"
                                    placeholder="0"
                                    value={moveQty}
                                    onChange={e => setMoveQty(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {moveModal.type === 'ENTRADA' ? 'Origem / Fornecedor' : 'Motivo / Máquina Destino'}
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows={2}
                                    placeholder={moveModal.type === 'SAIDA' ? "Ex: Manutenção Esteira 01..." : "Ex: Compra NF 123..."}
                                    value={moveReason}
                                    onChange={e => setMoveReason(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setMoveModal({ ...moveModal, open: false })}
                                    className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!moveQty || submitting}
                                    className={`flex-1 py-2 text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-opacity flex justify-center items-center ${moveModal.type === 'ENTRADA' ? 'bg-green-600' : 'bg-red-600'}`}
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Section */}
            <MovimentacaoHistorico search={filter} />
        </div>
    );
};

const MovimentacaoHistorico: React.FC<{ search: string }> = ({ search }) => {
    const [historico, setHistorico] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();

        const handleUpdate = () => loadHistory();
        window.addEventListener('STOCK_UPDATED', handleUpdate);
        return () => window.removeEventListener('STOCK_UPDATED', handleUpdate);
    }, []);

    const loadHistory = async () => {
        try {
            const data = await store.getHistoricoMovimentacoes();
            setHistorico(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filteredHistory = historico.filter(mov => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            mov.peca?.nome?.toLowerCase().includes(s) ||
            mov.motivo_maquina?.toLowerCase().includes(s) ||
            mov.usuario_id?.toLowerCase().includes(s) ||
            mov.tipo?.toLowerCase().includes(s)
        );
    });

    if (loading) return <div className="text-center py-8 text-slate-400">Carregando histórico...</div>;

    return (
        <div className="mt-12">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="bg-slate-200 p-2 rounded-lg"><MapPin size={20} className="text-slate-600" /></div>
                Histórico de Movimentações (Kardex)
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600">Data</th>
                            <th className="p-4 font-semibold text-slate-600">Tipo</th>
                            <th className="p-4 font-semibold text-slate-600">Item</th>
                            <th className="p-4 font-semibold text-slate-600">Qtd</th>
                            <th className="p-4 font-semibold text-slate-600">Justificativa / Origem / Destino</th>
                            <th className="p-4 font-semibold text-slate-600">Usuário</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredHistory.map((mov) => (
                            <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-slate-500">
                                    {new Date(mov.data_movimento).toLocaleDateString()} <small>{new Date(mov.data_movimento).toLocaleTimeString()}</small>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {mov.tipo === 'ENTRADA' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                        {mov.tipo}
                                    </span>
                                </td>
                                <td className="p-4 font-medium text-slate-800">{mov.peca?.nome || 'Item excluído'}</td>
                                <td className="p-4 font-bold text-slate-700">{mov.quantidade} <span className="text-xs font-normal text-slate-400">{mov.peca?.unidade_medida}</span></td>
                                <td className="p-4 text-slate-600 max-w-xs truncate" title={mov.motivo_maquina}>{mov.motivo_maquina || '-'}</td>
                                <td className="p-4 text-slate-400 text-xs">{mov.usuario_id}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredHistory.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        {historico.length === 0 ? 'Nenhuma movimentação registrada recentemente.' : 'Nenhuma movimentação encontrada para esta busca.'}
                    </div>
                )}
            </div>
        </div>
    );
}

export default EstoquePecas;
