import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Save, Send, ArrowLeft, Calendar } from 'lucide-react';
import { comprasService } from '../../services/comprasService';
import { PedidoCompra, ItemPedidoCompra, UrgenciaPedido } from '../../types_compras';
import { useAuth } from '../../contexts/AuthContext';

export const NovoPedidoCompra: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<PedidoCompra>>({
        titulo: '',
        urgencia: 'NORMAL',
        departamento: '',
        workflow_tipo: '',
        descricao: '',
        justificativa_negocio: '',
        data_entrega_desejada: ''
    });

    const [items, setItems] = useState<Partial<ItemPedidoCompra>[]>([
        { descricao: '', quantidade: 1, unidade: 'UN', preco_estimado: 0, especificacao_tecnica: '' }
    ]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index: number, field: keyof ItemPedidoCompra, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { descricao: '', quantidade: 1, unidade: 'UN', preco_estimado: 0, especificacao_tecnica: '' }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => acc + ((item.quantidade || 0) * (item.preco_estimado || 0)), 0);
    };

    const handleSubmit = async (status: 'RASCUNHO' | 'PENDENTE') => {
        if (!formData.titulo) return alert('Preencha o título do pedido');
        if (items.length === 0) return alert('Adicione pelo menos um item');

        try {
            setLoading(true);
            if (!user?.id) {
                alert('Erro: Usuário não identificado. Tente fazer login novamente.');
                setLoading(false);
                return;
            }

            const pedidoPayload = {
                ...formData,
                status,
                solicitante_id: user.id
            } as any;

            const itemsPayload = items.map(item => ({
                ...item,
                // Ensure numeric values
                quantidade: Number(item.quantidade),
                preco_estimado: Number(item.preco_estimado)
            })) as any;

            await comprasService.createPedido(pedidoPayload, itemsPayload);
            navigate('/compras');
        } catch (error: any) {
            console.error('Erro ao salvar pedido:', error);
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                alert('O servidor demorou muito para responder. Tente novamente em alguns segundos.');
            } else {
                alert('Erro ao salvar pedido: ' + (error.message || 'Verifique o console.'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/compras')} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Novo Pedido de Compra</h1>
                        <p className="text-slate-500">Preencha as informações abaixo para solicitar uma compra.</p>
                    </div>
                </div>

                {/* Main Form */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Título do Pedido *</label>
                            <input
                                type="text"
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleInputChange}
                                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                placeholder="Ex: Material de escritório"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Nível de Urgência *</label>
                            <select
                                name="urgencia"
                                value={formData.urgencia}
                                onChange={handleInputChange}
                                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-white"
                            >
                                <option value="BAIXA">Baixa</option>
                                <option value="NORMAL">Normal</option>
                                <option value="ALTA">Alta</option>
                                <option value="URGENTE">Urgente</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Departamento</label>
                            <select
                                name="departamento"
                                value={formData.departamento}
                                onChange={handleInputChange}
                                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-white"
                            >
                                <option value="">Selecione...</option>
                                <option value="Administrativo">Administrativo</option>
                                <option value="Produção">Produção</option>
                                <option value="Manutenção">Manutenção</option>
                                <option value="TI">TI</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Data de Entrega Desejada</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="date"
                                    name="data_entrega_desejada"
                                    value={formData.data_entrega_desejada}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-700">Descrição</label>
                            <textarea
                                name="descricao"
                                value={formData.descricao}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none"
                                placeholder="Descreva o propósito e detalhes do pedido..."
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-700">Justificativa do Negócio</label>
                            <textarea
                                name="justificativa_negocio"
                                value={formData.justificativa_negocio}
                                onChange={handleInputChange}
                                rows={2}
                                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none"
                                placeholder="Justifique a necessidade desta compra..."
                            />
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">Itens do Pedido</h2>
                        <button
                            onClick={addItem}
                            className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 relative group">
                                <button
                                    onClick={() => removeItem(index)}
                                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-1 text-sm font-medium text-slate-500 pt-3">
                                        Item {index + 1}
                                    </div>

                                    <div className="md:col-span-5 space-y-2">
                                        <label className="text-xs font-medium text-slate-600">Descrição *</label>
                                        <input
                                            type="text"
                                            value={item.descricao}
                                            onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-md text-sm focus:border-amber-500 outline-none"
                                            placeholder="Ex: Papel A4 75g"
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-medium text-slate-600">Qtd *</label>
                                        <input
                                            type="number"
                                            value={item.quantidade}
                                            onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-md text-sm focus:border-amber-500 outline-none"
                                            min="1"
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-medium text-slate-600">Unidade</label>
                                        <select
                                            value={item.unidade}
                                            onChange={(e) => handleItemChange(index, 'unidade', e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-md text-sm focus:border-amber-500 outline-none bg-white"
                                        >
                                            <option value="UN">UN</option>
                                            <option value="KG">KG</option>
                                            <option value="L">L</option>
                                            <option value="CX">CX</option>
                                            <option value="PCT">PCT</option>
                                            <option value="M">M</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-medium text-slate-600">Est. Unit (R$)</label>
                                        <input
                                            type="number"
                                            value={item.preco_estimado}
                                            onChange={(e) => handleItemChange(index, 'preco_estimado', e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-md text-sm focus:border-amber-500 outline-none"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="md:col-span-12 space-y-2">
                                        <label className="text-xs font-medium text-slate-600">Especificação Técnica / Detalhes</label>
                                        <input
                                            type="text"
                                            value={item.especificacao_tecnica}
                                            onChange={(e) => handleItemChange(index, 'especificacao_tecnica', e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-md text-sm focus:border-amber-500 outline-none"
                                            placeholder="Marca, modelo, cor..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <div className="text-right">
                            <span className="text-sm text-slate-500 mr-2">Total Estimado:</span>
                            <span className="text-xl font-bold text-slate-900">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pb-12">
                    <button
                        onClick={() => navigate('/compras')}
                        className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => handleSubmit('RASCUNHO')}
                        className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2 transition-colors"
                        disabled={loading}
                    >
                        <Save className="w-4 h-4" />
                        Salvar Rascunho
                    </button>
                    <button
                        onClick={() => handleSubmit('PENDENTE')}
                        className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-colors"
                        disabled={loading}
                    >
                        {loading ? 'Enviando...' : (
                            <>
                                <Send className="w-4 h-4" />
                                Enviar para Aprovação
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NovoPedidoCompra;
