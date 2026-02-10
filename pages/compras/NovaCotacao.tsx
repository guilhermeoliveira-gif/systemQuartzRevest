import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { comprasService } from '../../services/comprasService';
import { PedidoCompra } from '../../types_compras';

export const NovaCotacao: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const pedidoIdParam = searchParams.get('pedidoId');

    const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
    const [selectedPedidoId, setSelectedPedidoId] = useState(pedidoIdParam || '');
    const [titulo, setTitulo] = useState('');
    const [prazo, setPrazo] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch approved orders to select from
        comprasService.getPedidos().then(data => {
            const approved = data.filter(p => p.status === 'APROVADO' || p.status === 'PENDENTE'); // Allowing PENDENTE for testing ease
            setPedidos(approved);

            if (pedidoIdParam) {
                const pedido = approved.find(p => p.id === pedidoIdParam);
                if (pedido) {
                    setTitulo(`Cotação: ${pedido.titulo}`);
                    setSelectedPedidoId(pedido.id);
                }
            }
        });
    }, [pedidoIdParam]);

    const handlePedidoChange = (id: string) => {
        setSelectedPedidoId(id);
        const pedido = pedidos.find(p => p.id === id);
        if (pedido) {
            setTitulo(`Cotação: ${pedido.titulo}`);
        }
    };

    const handleSubmit = async () => {
        if (!selectedPedidoId || !titulo) return alert('Selecione um pedido e defina um título');

        try {
            setLoading(true);
            const pedido = pedidos.find(p => p.id === selectedPedidoId);
            if (!pedido) return; // Should not happen

            // Fetch full pedido to get items (since list might not have items populated deep)
            const fullPedido = await comprasService.getPedidoById(selectedPedidoId);

            await comprasService.createCotacao({
                titulo,
                pedido_id: selectedPedidoId,
                status: 'ABERTA',
                prazo_resposta: prazo ? prazo : undefined
            } as any, fullPedido.itens || []);

            navigate('/compras/cotacoes');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar cotação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/compras/cotacoes')} className="p-2 hover:bg-slate-200 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold">Nova Cotação</h1>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Pedido de Origem</label>
                        <select
                            value={selectedPedidoId}
                            onChange={(e) => handlePedidoChange(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg"
                        >
                            <option value="">Selecione um pedido aprovado...</option>
                            {pedidos.map(p => (
                                <option key={p.id} value={p.id}>{p.codigo} - {p.titulo}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Título da Cotação</label>
                        <input
                            type="text"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Prazo para Resposta</label>
                        <input
                            type="date"
                            value={prazo}
                            onChange={(e) => setPrazo(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg"
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Criando...' : 'Criar Cotação'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NovaCotacao;
