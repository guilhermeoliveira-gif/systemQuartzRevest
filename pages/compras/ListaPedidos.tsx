import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, LayoutGrid, List as ListIcon, Clock, AlertCircle } from 'lucide-react';
import { comprasService } from '../../services/comprasService';
import { PedidoCompra } from '../../types_compras';
import { LoadingState } from '../../components/LoadingState';

export const ListaPedidos: React.FC = () => {
    const navigate = useNavigate();
    const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
    const [filterStatus, setFilterStatus] = useState<string>('TODOS');

    useEffect(() => {
        fetchPedidos();
    }, []);

    const fetchPedidos = async () => {
        try {
            setLoading(true);
            const data = await comprasService.getPedidos();
            setPedidos(data);
        } catch (err) {
            console.error('Erro ao buscar pedidos:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'RASCUNHO': return 'bg-slate-100 text-slate-700';
            case 'PENDENTE': return 'bg-yellow-100 text-yellow-700';
            case 'EM_APROVACAO': return 'bg-orange-100 text-orange-700';
            case 'APROVADO': return 'bg-green-100 text-green-700';
            case 'REJEITADO': return 'bg-red-100 text-red-700';
            case 'EM_COTACAO': return 'bg-blue-100 text-blue-700';
            case 'CONCLUIDO': return 'bg-teal-100 text-teal-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        return status.replace('_', ' ');
    };

    const filteredPedidos = pedidos.filter(pedido => {
        const matchesStatus = filterStatus === 'TODOS' ||
            (filterStatus === 'RASCUNHO' && pedido.status === 'RASCUNHO') ||
            (filterStatus === 'EM_APROVACAO' && (pedido.status === 'PENDENTE' || pedido.status === 'EM_APROVACAO')) ||
            (filterStatus === 'APROVADOS' && (pedido.status === 'APROVADO' || pedido.status === 'CONCLUIDO' || pedido.status === 'EM_COTACAO'));

        const matchesSearch = pedido.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pedido.codigo?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    if (loading) return <LoadingState />;

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pedidos de Compra</h1>
                    <p className="text-slate-500">Listagem de solicitações de compra.</p>
                </div>
                <div>
                    <button
                        onClick={() => navigate('/compras/novo')}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 transition-colors font-medium shadow-md shadow-amber-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Pedido
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por título ou número..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm focus:outline-none"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="TODOS">Todos Status</option>
                        <option value="RASCUNHO">Rascunhos</option>
                        <option value="EM_APROVACAO">Em Aprovação</option>
                        <option value="APROVADOS">Aprovados/Concluídos</option>
                    </select>

                    <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>

                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            {viewMode === 'list' ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {filteredPedidos.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Nenhum pedido encontrado.</div>
                    ) : (
                        <div className="flex flex-col divide-y divide-slate-100">
                            {filteredPedidos.map(pedido => (
                                <div key={pedido.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => navigate(`/compras/pedidos/${pedido.id}`)}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-slate-900">{pedido.titulo}</h3>
                                            {pedido.codigo && <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{pedido.codigo}</span>}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-500">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                                                {getStatusLabel(pedido.status)}
                                            </span>
                                            {pedido.urgencia === 'URGENTE' && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Urgentíssima</span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(pedido.created_at || '').toLocaleDateString('pt-BR')}
                                            </span>
                                            <span>• {pedido.itens?.length || 0} itens</span>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600">•••</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPedidos.map(pedido => (
                        <div key={pedido.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/compras/pedidos/${pedido.id}`)}>
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                                    {getStatusLabel(pedido.status)}
                                </span>
                                {pedido.urgencia === 'URGENTE' && (
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1">{pedido.titulo}</h3>
                            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{pedido.descricao || 'Sem descrição'}</p>
                            <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
                                <span>{pedido.department}</span>
                                <span>{new Date(pedido.created_at || '').toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ListaPedidos;
