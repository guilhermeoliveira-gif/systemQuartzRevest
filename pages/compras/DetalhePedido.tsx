import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { comprasService } from '../../services/comprasService';
import { PedidoCompra } from '../../types_compras';
import { LoadingState } from '../../components/LoadingState';

export const DetalhePedido: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState<PedidoCompra | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchPedido(id);
    }, [id]);

    const fetchPedido = async (pedidoId: string) => {
        try {
            setLoading(true);
            const data = await comprasService.getPedidoById(pedidoId);
            setPedido(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAprovar = async () => {
        if (!pedido) return;
        try {
            await comprasService.updateStatusPedido(pedido.id, 'APROVADO');
            fetchPedido(pedido.id);
            alert('Pedido aprovado com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao aprovar pedido');
        }
    };

    const handleRejeitar = async () => {
        if (!pedido) return;
        try {
            await comprasService.updateStatusPedido(pedido.id, 'REJEITADO');
            fetchPedido(pedido.id);
        } catch (error) {
            console.error(error);
            alert('Erro ao rejeitar pedido');
        }
    };

    const handleIniciarCotacao = () => {
        if (!pedido) return;
        navigate(`/compras/cotacoes/nova?pedidoId=${pedido.id}`);
    };

    if (loading) return <LoadingState />;
    if (!pedido) return <div>Pedido não encontrado</div>;

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/compras')} className="p-2 hover:bg-slate-200 rounded-lg">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{pedido.titulo}</h1>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>{pedido.codigo}</span>
                            <span>•</span>
                            <span>{new Date(pedido.created_at || '').toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                    <div className="ml-auto flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${pedido.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                                pedido.status === 'PENDENTE' || pedido.status === 'EM_APROVACAO' ? 'bg-yellow-100 text-yellow-700' :
                                    pedido.status === 'REJEITADO' ? 'bg-red-100 text-red-700' :
                                        'bg-slate-100 text-slate-700'
                            }`}>
                            {pedido.status}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-slate-500">Departamento</h3>
                            <p className="text-slate-900">{pedido.departamento}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-slate-500">Urgência</h3>
                            <p className="text-slate-900">{pedido.urgencia}</p>
                        </div>
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-medium text-slate-500">Descrição</h3>
                            <p className="text-slate-900">{pedido.descricao}</p>
                        </div>
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-medium text-slate-500">Justificativa</h3>
                            <p className="text-slate-900">{pedido.justificativa_negocio}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-4 border-b pb-2">Itens Solicitados</h3>
                        <div className="space-y-3">
                            {pedido.itens?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-900">{item.descricao}</p>
                                        <p className="text-sm text-slate-500">{item.especificacao_tecnica}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900">{item.quantidade} {item.unidade}</p>
                                        {item.preco_estimado && (
                                            <p className="text-xs text-slate-500">Est. {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_estimado)}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex justify-end gap-3 pt-4">
                    {(pedido.status === 'PENDENTE' || pedido.status === 'EM_APROVACAO') && (
                        <>
                            <button
                                onClick={handleRejeitar}
                                className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                Rejeitar
                            </button>
                            <button
                                onClick={handleAprovar}
                                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-2 shadow-sm"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Aprovar Pedido
                            </button>
                        </>
                    )}

                    {pedido.status === 'APROVADO' && (
                        <button
                            onClick={handleIniciarCotacao}
                            className="px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-lg flex items-center gap-2 shadow-sm"
                        >
                            <FileText className="w-4 h-4" />
                            Iniciar Cotação
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetalhePedido;
