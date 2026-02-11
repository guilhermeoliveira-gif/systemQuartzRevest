import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { comprasService } from '../../services/comprasService';
import { PedidoCompra, ItemPedidoCompra, Fornecedor } from '../../types_compras';

interface NovaCotacaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    pedido: PedidoCompra;
    onSuccess: () => void;
}

export const NovaCotacaoModal: React.FC<NovaCotacaoModalProps> = ({ isOpen, onClose, pedido, onSuccess }) => {
    const [titulo, setTitulo] = useState('');
    const [necessarioAte, setNecessarioAte] = useState('');
    const [descricao, setDescricao] = useState('');
    const [prazoDias, setPrazoDias] = useState('5');
    const [minCotacoes, setMinCotacoes] = useState('3');
    const [itens, setItens] = useState<ItemPedidoCompra[]>([]);
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [selectedFornecedores, setSelectedFornecedores] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && pedido) {
            setTitulo(`Cotação: ${pedido.titulo}`);
            setDescricao(`Solicitação de cotação referente ao pedido ${pedido.codigo || ''}`);
            setItens(pedido.itens || []);
            loadFornecedores();
        }
    }, [isOpen, pedido]);

    const loadFornecedores = async () => {
        try {
            const data = await comprasService.getFornecedores();
            setFornecedores(data);
        } catch (error) {
            console.error('Erro ao carregar fornecedores', error);
        }
    };

    const handleCreate = async () => {
        if (!titulo || !necessarioAte) return alert('Preencha os campos obrigatórios (*)');

        try {
            setLoading(true);

            // Calculate deadline data
            const prazoDate = new Date();
            prazoDate.setDate(prazoDate.getDate() + parseInt(prazoDias));

            const newCotacao = await comprasService.createCotacao({
                pedido_id: pedido.id,
                titulo,
                status: 'ABERTA',
                prazo_resposta: prazoDate.toISOString(),
                // Store description/deadline/etc if we had fields in DB. 
                // For MVP, title and deadline are key. 
                // We might need to extend Cotacao type if we want to store 'necessarioAte' separately but 'prazo_resposta' covers deadline.
            } as any, itens);

            // Add selected suppliers
            if (selectedFornecedores.length > 0) {
                for (const fornecedorId of selectedFornecedores) {
                    await comprasService.addFornecedorCotacao(newCotacao.id, fornecedorId);
                }
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao criar cotação');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Nova Cotação (RFQ)</h2>
                        <p className="text-sm text-slate-500">Crie uma nova solicitação de cotação para enviar aos fornecedores</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    {/* Top Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Titulo *</label>
                            <input
                                value={titulo}
                                onChange={e => setTitulo(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium"
                                placeholder="Ex: Compra de Material de Escritório"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Necessário até *</label>
                            <input
                                type="date"
                                value={necessarioAte}
                                onChange={e => setNecessarioAte(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Descrição</label>
                            <textarea
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium h-24 resize-none"
                                placeholder="Descreva os detalhes da cotação..."
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Prazo para resposta (dias)</label>
                            <select
                                value={prazoDias}
                                onChange={e => setPrazoDias(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium appearance-none"
                            >
                                <option value="3">3 dias</option>
                                <option value="5">5 dias</option>
                                <option value="7">7 dias</option>
                                <option value="15">15 dias</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Minimo de cotações</label>
                            <select
                                value={minCotacoes}
                                onChange={e => setMinCotacoes(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium appearance-none"
                            >
                                <option value="1">1 cotação</option>
                                <option value="3">3 cotações</option>
                                <option value="5">5 cotações</option>
                            </select>
                        </div>
                    </div>

                    {/* Itens */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <label className="block text-sm font-bold text-slate-700">Itens da Cotação</label>
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors active:scale-95 active:bg-slate-300">
                                <Plus size={16} />
                                Adicionar Item
                            </button>
                        </div>

                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
                            {itens.length === 0 ? (
                                <p className="text-center text-slate-400 py-4">Nenhum item adicionado.</p>
                            ) : (
                                itens.map((item, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-slate-800">Item {idx + 1}</span>
                                            {/* Delete Button would go here */}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Descrição *</label>
                                                <input
                                                    value={item.descricao}
                                                    readOnly
                                                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Especificação</label>
                                                <input
                                                    value={item.especificacao_tecnica || ''}
                                                    readOnly
                                                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Quantidade *</label>
                                                <input
                                                    value={item.quantidade}
                                                    readOnly
                                                    inputMode="numeric"
                                                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Unidade</label>
                                                <input
                                                    value={item.unidade}
                                                    readOnly
                                                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Suppliers */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Fornecedores</label>
                        <div className="flex flex-col md:flex-row gap-2 mb-4">
                            <select
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                onChange={(e) => {
                                    if (e.target.value && !selectedFornecedores.includes(e.target.value)) {
                                        setSelectedFornecedores([...selectedFornecedores, e.target.value]);
                                    }
                                }}
                                value=""
                            >
                                <option value="">Selecione um fornecedor...</option>
                                {fornecedores.map(f => (
                                    <option key={f.id} value={f.id}>{f.nome}</option>
                                ))}
                            </select>
                            <button className="px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 font-medium active:bg-slate-100">
                                Digitar Email
                            </button>
                        </div>

                        {/* Selected Suppliers Chips */}
                        <div className="flex flex-wrap gap-2">
                            {selectedFornecedores.map(fid => {
                                const f = fornecedores.find(forn => forn.id === fid);
                                return (
                                    <div key={fid} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold border border-indigo-100">
                                        {f?.nome}
                                        <button onClick={() => setSelectedFornecedores(selectedFornecedores.filter(id => id !== fid))}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                            {selectedFornecedores.length === 0 && (
                                <span className="text-sm text-slate-400 italic">Nenhum fornecedor selecionado (opcional)</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse md:flex-row justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors active:bg-slate-100"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full md:w-auto px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-95"
                    >
                        {loading ? 'Processando...' : 'Criar Cotação'}
                    </button>
                </div>
            </div>
        </div>
    );
};
