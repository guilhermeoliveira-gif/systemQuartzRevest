import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, LayoutGrid, List as ListIcon, Clock, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import { comprasService } from '../../services/comprasService';
import { PedidoCompra } from '../../types_compras';
import { LoadingState } from '../../components/LoadingState';

export const ComprasDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            setError('Falha ao carregar pedidos de compra.');
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: pedidos.length,
        rascunhos: pedidos.filter(p => p.status === 'RASCUNHO').length,
        emAprovacao: pedidos.filter(p => p.status === 'PENDENTE' || p.status === 'EM_APROVACAO').length,
        aprovados: pedidos.filter(p => p.status === 'APROVADO' || p.status === 'CONCLUIDO' || p.status === 'EM_COTACAO').length
    };

    if (loading) return <LoadingState />;

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard de Compras</h1>
                    <p className="text-slate-500">Visão geral e indicadores de desempenho.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/compras/novo')}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 transition-colors font-medium shadow-md shadow-amber-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Pedido
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    label="Total"
                    value={stats.total}
                    subtext="Pedidos cadastrados"
                    onClick={() => { }}
                />
                <StatCard
                    label="Rascunhos"
                    value={stats.rascunhos}
                    subtext="Não enviados"
                    onClick={() => { }}
                />
                <StatCard
                    label="Em Aprovação"
                    value={stats.emAprovacao}
                    subtext="Aguardando aprovação"
                    onClick={() => { }}
                />
                <StatCard
                    label="Aprovados"
                    value={stats.aprovados}
                    subtext="Prontos para compra"
                    onClick={() => { }}
                />
            </div>

            {/* Filters & Search - Removed, moved to Pedidos page */}

            <div className="flex justify-center mt-8">
                <button
                    onClick={() => navigate('/compras/pedidos')}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium shadow-sm"
                >
                    Ver Todos os Pedidos
                </button>
            </div>
        </div>
    );
};

interface StatCardProps {
    label: string;
    value: number;
    subtext: string;
    active?: boolean;
    onClick: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, active, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${active ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-slate-200 hover:border-amber-300'}`}
    >
        <div className="text-sm text-slate-500 mb-1">{label}</div>
        <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
        <div className="text-xs text-slate-400">{subtext}</div>
    </div>
);

export default ComprasDashboard;
