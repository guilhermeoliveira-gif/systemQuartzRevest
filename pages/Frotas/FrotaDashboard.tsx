import React, { useState, useEffect } from 'react';
import { Truck, Fuel, DollarSign, Wrench, BarChart2, Activity, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { frotaService } from '../../services/frotaService';
import { RegistrarAbastecimentoModal } from '../../components/Frotas/RegistrarAbastecimentoModal';

const FrotaDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalVeiculos: 0,
        veiculosAtivos: 0,
        custoAbastecimentoMes: 0,
        custoManutencaoMes: 0,
        totalAbastecimentos: 0,
        mediaKmLGeral: 0
    });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const veiculos = await frotaService.getVeiculos();
            const abastecimentos = await frotaService.getAllAbastecimentos();
            const manutencoes = await frotaService.getAllManutencoes();

            // Stats Básicos
            const totalVeiculos = veiculos.length;
            const veiculosAtivos = veiculos.filter(v => v.status === 'ATIVO').length;

            // Filtros de Data (Mês Atual)
            const hoje = new Date();
            const mesAtual = hoje.getMonth();
            const anoAtual = hoje.getFullYear();

            const absMes = abastecimentos.filter(a => {
                const d = new Date(a.data);
                return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
            });

            const manMes = manutencoes.filter(m => {
                const d = new Date(m.data);
                return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
            });

            const custoAbastecimentoMes = absMes.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
            const custoManutencaoMes = manMes.reduce((acc, curr) => acc + (curr.custo || 0), 0);

            // Média Geral
            const absComMedia = abastecimentos.filter(a => a.media_km_l && a.media_km_l > 0);
            const mediaGeral = absComMedia.length > 0
                ? absComMedia.reduce((acc, curr) => acc + (curr.media_km_l || 0), 0) / absComMedia.length
                : 0;

            setStats({
                totalVeiculos,
                veiculosAtivos,
                custoAbastecimentoMes,
                custoManutencaoMes,
                totalAbastecimentos: abastecimentos.length,
                mediaKmLGeral: mediaGeral
            });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando dashboard...</div>;

    const cards = [
        {
            title: 'Veículos Ativos',
            value: `${stats.veiculosAtivos} / ${stats.totalVeiculos}`,
            icon: Truck,
            color: 'bg-blue-100 text-blue-600',
            desc: 'Frota operante'
        },
        {
            title: 'Gasto Combustível (Mês)',
            value: `R$ ${stats.custoAbastecimentoMes.toFixed(2)}`,
            icon: Fuel,
            color: 'bg-green-100 text-green-600',
            desc: 'Referente ao mês atual'
        },
        {
            title: 'Gasto Manutenção (Mês)',
            value: `R$ ${stats.custoManutencaoMes.toFixed(2)}`,
            icon: Wrench,
            color: 'bg-red-100 text-red-600',
            desc: 'Referente ao mês atual'
        },
        {
            title: 'Média Consumo Geral',
            value: `${stats.mediaKmLGeral.toFixed(2)} km/l`,
            icon: Activity,
            color: 'bg-purple-100 text-purple-600',
            desc: 'Eficiência média da frota'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart2 className="text-blue-600" />
                    Dashboard da Frota
                </h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-all font-bold shadow-md transform active:scale-95"
                >
                    <Plus size={20} />
                    Registrar Abastecimento
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg ${card.color}`}>
                                <card.icon size={24} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">{card.value}</h3>
                        <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
                        <p className="text-xs text-slate-400">{card.desc}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Fuel size={18} className="text-slate-400" />
                        Acesso Rápido
                    </h3>
                    <div className="space-y-3">
                        <Link to="/frotas/veiculos" className="block p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-700">Gerenciar Veículos</span>
                                <span className="text-slate-400">→</span>
                            </div>
                        </Link>
                        <Link to="/frotas/abastecimentos" className="block p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-700">Histórico de Abastecimentos</span>
                                <span className="text-slate-400">→</span>
                            </div>
                        </Link>
                        <Link to="/frotas/manutencoes" className="block p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-700">Histórico de Manutenções</span>
                                <span className="text-slate-400">→</span>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">Dica de Gestão</h3>
                        <p className="text-blue-100 mb-4">Mantenha os odômetros sempre atualizados para garantir cálculos precisos de média de consumo e alertas de manutenção preventiva.</p>
                        <Link to="/frotas/veiculos" className="inline-block bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm">
                            Verificar Veículos
                        </Link>
                    </div>
                    <Truck className="absolute -bottom-6 -right-6 w-48 h-48 text-white/10" />
                </div>
            </div>

            <RegistrarAbastecimentoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadDashboard}
            />
        </div>
    );
};

export default FrotaDashboard;

