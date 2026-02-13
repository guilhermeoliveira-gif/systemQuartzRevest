import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, User } from 'lucide-react';
import { vendasService } from '../../services/vendasService';
import { VendaPedido } from '../../types_vendas';

const VendasDashboard: React.FC = () => {
    const [pedidos, setPedidos] = useState<VendaPedido[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPedidos();
    }, []);

    const loadPedidos = async () => {
        try {
            const data = await vendasService.getPedidos();
            setPedidos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Vendas & Pedidos</h1>
                    <p className="text-slate-500">Gerencie clientes, orçamentos e vendas.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/vendas/clientes" className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">
                        <User size={18} /> Clientes
                    </Link>
                    <Link to="/vendas/novo" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-200">
                        <Plus size={18} /> Novo Pedido
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Carregando pedidos...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                                <tr>
                                    <th className="px-6 py-4">Nº Pedido</th>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Data Emissão</th>
                                    <th className="px-6 py-4">Previsão</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Valor Total</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pedidos.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-slate-500">Nenhum pedido encontrado.</td></tr>
                                ) : pedidos.map((pedido) => (
                                    <tr key={pedido.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-slate-900">
                                            #{pedido.numero_pedido}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {(pedido.cliente as any)?.nome || 'Cliente N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(pedido.data_emissao).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {pedido.data_previsao_entrega ? new Date(pedido.data_previsao_entrega).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${pedido.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                                                pedido.status === 'ORCAMENTO' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                {pedido.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            R$ {pedido.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">Ver Detalhes</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendasDashboard;
