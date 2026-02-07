
import React, { useState, useEffect } from 'react';
import {
    Activity, Wrench, AlertTriangle, CheckCircle2,
    ArrowRight, Settings, Clock, Gauge
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { manutencaoService } from '../../services/manutencaoService';
import { Maquina } from '../../types_manutencao';

const ManutencaoDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await manutencaoService.getMaquinas();
            setMaquinas(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const statusStats = {
        operacional: maquinas.filter(m => m.status === 'Operacional').length,
        manutencao: maquinas.filter(m => m.status === 'Em Manutenção').length,
        parada: maquinas.filter(m => m.status === 'Parada').length,
        critica: maquinas.filter(m => (m.horas_uso_total - m.ultima_manutencao_horas) >= m.intervalo_manutencao_horas).length
    };

    const cards = [
        { title: "Operacionais", value: statusStats.operacional, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
        { title: "Em Manutenção", value: statusStats.manutencao, icon: Wrench, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Paradas", value: statusStats.parada, icon: Activity, color: "text-red-600", bg: "bg-red-50" },
        { title: "Alerta de Uso", value: statusStats.critica, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" }
    ];

    return (
        <div className="space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manutenção de Ativos</h1>
                <p className="text-slate-500 font-medium font-mono text-sm uppercase tracking-widest mt-1">Status de Maquinário Industrial</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <div className={`p-3 w-fit rounded-2xl ${card.bg} mb-4`}>
                                <Icon className={card.color} size={24} />
                            </div>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">{card.title}</p>
                            <p className={`text-4xl font-black ${card.color}`}>{card.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Saúde das Ativos (Progress Bars for hours) */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Gauge size={24} className="text-blue-800" />
                            Saúde dos Ativos (Horas de Uso)
                        </h2>
                        <button onClick={() => navigate('/manutencao/maquinas')} className="text-xs font-black text-blue-800 uppercase tracking-widest hover:underline flex items-center gap-1">
                            Ver Máquinas <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-8">
                        {maquinas.map(m => {
                            const horasDesdeUltima = m.horas_uso_total - m.ultima_manutencao_horas;
                            const percent = Math.min(Math.round((horasDesdeUltima / m.intervalo_manutencao_horas) * 100), 100);
                            const isCritical = percent >= 95;
                            const isWarning = percent >= 80;

                            return (
                                <div key={m.id} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <p className="font-black text-slate-800">{m.nome}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{m.modelo} • S/N: {m.serie}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-black ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-600'}`}>
                                                {horasDesdeUltima} / {m.intervalo_manutencao_horas}h
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    {isCritical && (
                                        <p className="text-[10px] text-red-500 font-black mt-2 flex items-center gap-1 animate-pulse">
                                            <AlertTriangle size={12} /> NECESSÁRIO MANUTENÇÃO PREVENTIVA IMEDIATA
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                        {maquinas.length === 0 && (
                            <p className="text-center py-10 text-slate-400 italic">Nenhuma máquina cadastrada.</p>
                        )}
                    </div>
                </div>

                {/* Últimas OS / Atalhos */}
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10">
                            <Settings size={120} className="text-white" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 opacity-60">Ações Rápidas</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/manutencao/os')}
                                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all font-bold group"
                            >
                                <span>Abrir Nova OS</span>
                                <Plus size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => navigate('/manutencao/maquinas')}
                                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all font-bold group"
                            >
                                <span>Gerenciar Frota</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Clock size={16} /> Próximas Preventivas
                        </h3>
                        <div className="space-y-4">
                            {maquinas.sort((a, b) => {
                                const pa = (a.horas_uso_total - a.ultima_manutencao_horas) / a.intervalo_manutencao_horas;
                                const pb = (b.horas_uso_total - b.ultima_manutencao_horas) / b.intervalo_manutencao_horas;
                                return pb - pa;
                            }).slice(0, 3).map(m => (
                                <div key={m.id} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 font-black">
                                        {m.nome.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-slate-800 truncate">{m.nome}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Restam {Math.max(0, m.intervalo_manutencao_horas - (m.horas_uso_total - m.ultima_manutencao_horas))} horas</p>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${m.status === 'Operacional' ? 'bg-green-500' : 'bg-red-500'}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Plus = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export default ManutencaoDashboard;
