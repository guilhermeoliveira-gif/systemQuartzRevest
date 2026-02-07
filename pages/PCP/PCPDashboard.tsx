
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, CheckCircle, PackageOpen,
    ArrowRight, TrendingUp, Clock, AlertTriangle
} from 'lucide-react';
import { pcpService } from '../../services/pcpService';

const PCPDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        planejada: 0,
        concluida: 0,
        pendente: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const planos = await pcpService.getPlanos();

            // Basic stats calculation
            let planejada = 0;
            let concluida = 0;

            planos.forEach(p => {
                p.itens?.forEach(item => {
                    planejada += item.qtd_misturas_planejadas;
                    concluida += Number(item.qtd_produzida) || 0;
                });
            });

            setStats({
                planejada,
                concluida,
                pendente: planejada - concluida
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        {
            title: "Produção Planejada",
            value: stats.planejada,
            icon: LayoutDashboard,
            color: "text-blue-800",
            desc: "Total de misturas previstas"
        },
        {
            title: "Produção Concluída",
            value: stats.concluida,
            icon: CheckCircle,
            color: "text-green-600",
            desc: "Misturas já realizadas"
        },
        {
            title: "Materiais Pendentes",
            value: stats.pendente > 0 ? stats.pendente : 0,
            icon: PackageOpen,
            color: "text-orange-600",
            desc: "Misturas aguardando início"
        }
    ];

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard PCP</h1>
                    <p className="text-slate-500 font-medium">Controle operacional e planejamento de misturas</p>
                </div>
            </header>

            {/* Grid de Cards Informativos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                    <Icon className={card.color} size={24} />
                                </div>
                                <span className="text-[10px] font-black p-1.5 bg-slate-50 rounded text-slate-400 uppercase tracking-widest">PCP</span>
                            </div>
                            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wide mb-1">{card.title}</h3>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-black ${card.color}`}>{card.value}</span>
                                <span className="text-slate-400 text-xs font-bold uppercase">un</span>
                            </div>
                            <p className="mt-4 text-xs text-slate-400 font-medium">{card.desc}</p>
                        </div>
                    );
                })}

                {/* Quick Access Card */}
                <div
                    onClick={() => navigate('/pcp/planejamento')}
                    className="bg-blue-800 p-6 rounded-2xl shadow-lg border border-blue-900 cursor-pointer hover:bg-blue-900 transition-all flex flex-col justify-between"
                >
                    <div className="text-blue-200">
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-lg">Planejar Agora</h3>
                        <p className="text-blue-300 text-xs font-medium mb-4">Acesse as ordens de produção</p>
                        <div className="flex items-center text-white font-bold text-sm gap-2">
                            Ver planejamento <ArrowRight size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Supplementary Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                        <Clock size={24} className="text-blue-800" />
                        Status por Operação
                    </h2>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-10 bg-blue-800 rounded-full" />
                            <div className="flex-1">
                                <p className="text-sm font-black text-slate-800">Preparação de Insumos</p>
                                <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                                    <div className="bg-blue-800 h-2 rounded-full w-[70%]" />
                                </div>
                            </div>
                            <span className="font-black text-blue-800">70%</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-10 bg-green-500 rounded-full" />
                            <div className="flex-1">
                                <p className="text-sm font-black text-slate-800">Processamento Final</p>
                                <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                                    <div className="bg-green-500 h-2 rounded-full w-[45%]" />
                                </div>
                            </div>
                            <span className="font-black text-green-500">45%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <AlertTriangle size={120} className="text-white" />
                    </div>
                    <h2 className="text-xl font-black text-white mb-4">Alertas de Produção</h2>
                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">Contador 1 Descalibrado</p>
                                <p className="text-slate-400 text-xs text-balance">Verifique a última leitura do registrador no painel.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PCPDashboard;
