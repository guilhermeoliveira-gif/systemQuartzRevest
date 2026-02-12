import React, { useEffect, useState } from 'react';
import { ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { vendasService } from '../../services/vendasService';
import { useNavigate } from 'react-router-dom';

const VendasSummary: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalPedidos: 0,
        valorTotal: 0,
        pedidosHoje: 0
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const pedidos = await vendasService.getPedidos();
            const hoje = new Date().toISOString().split('T')[0];

            const totalPedidos = pedidos.length;
            const valorTotal = pedidos.reduce((acc: number, curr: any) => acc + (curr.valor_total || 0), 0);
            const pedidosHoje = pedidos.filter((p: any) => p.data_emissao?.startsWith(hoje)).length;

            setStats({ totalPedidos, valorTotal, pedidosHoje });
        } catch (error) {
            console.error('Erro ao carregar stats de vendas', error);
        }
    };

    return (
        <div
            onClick={() => navigate('/vendas')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Vendas</h3>
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                    <ShoppingCart size={20} />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Pedidos</span>
                    <span className="text-lg font-black text-slate-800">{stats.totalPedidos}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Faturamento</span>
                    <span className="text-lg font-black text-green-600">
                        R$ {stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">Hoje</span>
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                        <TrendingUp size={14} className="text-green-500" /> {stats.pedidosHoje}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default VendasSummary;
