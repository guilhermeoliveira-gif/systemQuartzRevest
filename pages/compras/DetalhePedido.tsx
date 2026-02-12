import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, Plus, Eye } from 'lucide-react';
import { comprasService } from '../../services/comprasService';
import { PedidoCompra, Cotacao } from '../../types_compras';
import { LoadingState } from '../../components/LoadingState';
import { NovaCotacaoModal } from './NovaCotacaoModal'; // Adjust path if needed. It's in same folder.

export const DetalhePedido: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState<PedidoCompra | null>(null);
    const [cotacoes, setCotacoes] = useState<(Cotacao & { fornecedores: { count: number }[], propostas: { count: number }[] })[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'DETALHES' | 'COTACOES'>('DETALHES');
    const [isNovaCotacaoOpen, setIsNovaCotacaoOpen] = useState(false);

    useEffect(() => {
        if (id) {
            fetchPedido(id);
            fetchCotacoes(id);
        }
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

    const fetchCotacoes = async (pedidoId: string) => {
        try {
            const data = await comprasService.getCotacoesByPedidoId(pedidoId);
            setCotacoes(data);
        } catch (error) {
            console.error(error);
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

    if (loading) return <LoadingState />;
    if (!pedido) return <div>Pedido não encontrado</div>;

    const showTabs = pedido.status === 'APROVADO' || pedido.status === 'EM_COTACAO' || pedido.status === 'CONCLUIDO';

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/compras/pedidos')} className="p-2 hover:bg-slate-200 rounded-lg">
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
                            {pedido.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                {/* Tabs Navigation */}
                {showTabs && (
                    <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
                        <button
                            onClick={() => setActiveTab('DETALHES')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'DETALHES' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Detalhes do Pedido
                        </button>
                        <button
                            onClick={() => setActiveTab('COTACOES')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'COTACOES' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Cotações ({cotacoes.length})
                        </button>
                    </div>
                )}

                {/* Content based on Tab */}
                {(activeTab === 'DETALHES' || !showTabs) ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-slate-500">Departamento</h3>
                                <p className="text-slate-900">{String(pedido.departamento || '')}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-slate-500">Urgência</h3>
                                <p className="text-slate-900">{pedido.urgencia}</p>
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="text-sm font-medium text-slate-500">Descrição</h3>
                                <p className="text-slate-900">{String(pedido.descricao || '')}</p>
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="text-sm font-medium text-slate-500">Justificativa</h3>
                                <p className="text-slate-900">{String(pedido.justificativa_negocio || '')}</p>
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

                        {/* Approval Actions (only if PENDING) */}
                        {(pedido.status === 'PENDENTE' || pedido.status === 'EM_APROVACAO') && (
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
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
                            </div>
                        )}
                    </div>
                ) : (
                    /* Cotações Tab Content */
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Procure os melhores preços</h3>
                                <p className="text-slate-500 text-sm">Crie RFQs para solicitar cotações de fornecedores.</p>
                            </div>
                            <button
                                onClick={() => setIsNovaCotacaoOpen(true)}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 transition-colors font-medium shadow-md shadow-amber-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                Nova Cotação
                            </button>
                        </div>

                        {/* List of Cotacoes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {cotacoes.length === 0 ? (
                                <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500 font-medium">Nenhuma cotação criada para este pedido.</p>
                                </div>
                            ) : (
                                cotacoes.map(cotacao => (
                                    <div key={cotacao.id} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate(`/compras/cotacoes/${cotacao.id}`)}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{cotacao.titulo}</h4>
                                                <span className="text-xs text-slate-400">Criado em {new Date(cotacao.created_at || '').toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${cotacao.status === 'CONCLUIDA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {cotacao.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm text-slate-500">
                                            <div className="flex flex-col">
                                                <span className="text-xs uppercase font-bold text-slate-400">Convites</span>
                                                <span className="font-medium text-slate-700">{cotacao.fornecedores?.[0]?.count || 0}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs uppercase font-bold text-slate-400">Propostas</span>
                                                <span className="font-medium text-slate-700">{cotacao.propostas?.[0]?.count || 0}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs uppercase font-bold text-slate-400">Prazo</span>
                                                <span className="font-medium text-slate-700">{cotacao.prazo_resposta ? new Date(cotacao.prazo_resposta).toLocaleDateString('pt-BR') : '-'}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                                            <button className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">
                                                Ver Detalhes <Eye size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <NovaCotacaoModal
                isOpen={isNovaCotacaoOpen}
                onClose={() => setIsNovaCotacaoOpen(false)}
                pedido={pedido}
                onSuccess={() => {
                    fetchCotacoes(pedido.id);
                    // Also refresh pedido status if needed
                    if (pedido.status === 'APROVADO') fetchPedido(pedido.id);
                }}
            />
        </div>
    );
};

export default DetalhePedido;
