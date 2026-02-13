import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, FolderKanban, CheckSquare, Package, AlertCircle,
    TrendingUp, Clock, Users, BarChart3, Truck, Wrench, ChevronRight
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import VendasSummary from '../components/dashboard/VendasSummary';
import ChecklistSummary from '../components/dashboard/ChecklistSummary';

interface DashboardStats {
    ncs: { total: number; abertas: number; criticas: number };
    projetos: { total: number; emAndamento: number; atrasados: number };
    tarefas: { total: number; pendentes: number; atrasadas: number };
    estoque: { alertas: number; criticos: number };
}

interface PrioridadeAction {
    id: string;
    titulo: string;
    prazo: string;
    prioridade: string;
    origem: string;
    status: string;
}

const DashboardGlobal: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        ncs: { total: 0, abertas: 0, criticas: 0 },
        projetos: { total: 0, emAndamento: 0, atrasados: 0 },
        tarefas: { total: 0, pendentes: 0, atrasadas: 0 },
        estoque: { alertas: 0, criticos: 0 }
    });
    const [prioridades, setPrioridades] = useState<PrioridadeAction[]>([]);

    useEffect(() => {
        loadStats();
        loadPrioridades();
    }, []);

    const loadPrioridades = async () => {
        try {
            const { data, error } = await supabase
                .from('tarefas_unificadas')
                .select('*')
                .neq('status', 'CONCLUIDA')
                .neq('status', 'CANCELADA')
                .order('prazo', { ascending: true })
                .limit(5);

            if (data) {
                setPrioridades(data as PrioridadeAction[]);
            }
        } catch (error) {
            console.error('Erro ao carregar prioridades:', error);
        }
    };

    const loadStats = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase.rpc('get_dashboard_global_stats');

            if (error) {
                console.error('Erro ao carregar estatísticas via RPC:', error);
                // Fallback para objetos vazios se falhar
                return;
            }

            if (data) {
                setStats(data as DashboardStats);
            }
        } catch (error: any) {
            console.error('Erro inesperado ao carregar estatísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        {
            title: 'Não Conformidades',
            icon: FileText,
            color: 'red',
            stats: [
                { label: 'Total', value: stats.ncs.total },
                { label: 'Abertas', value: stats.ncs.abertas, highlight: true },
                { label: 'Críticas', value: stats.ncs.criticas, urgent: true }
            ],
            link: '/qualidade/nao-conformidades'
        },
        {
            title: 'Projetos',
            icon: FolderKanban,
            color: 'teal',
            stats: [
                { label: 'Total', value: stats.projetos.total },
                { label: 'Em Andamento', value: stats.projetos.emAndamento, highlight: true },
                { label: 'Atrasados', value: stats.projetos.atrasados, urgent: true }
            ],
            link: '/projetos/dashboard'
        },
        {
            title: 'Tarefas',
            icon: CheckSquare,
            color: 'blue',
            stats: [
                { label: 'Total', value: stats.tarefas.total },
                { label: 'Pendentes', value: stats.tarefas.pendentes, highlight: true },
                { label: 'Atrasadas', value: stats.tarefas.atrasadas, urgent: true }
            ],
            link: '/minhas-tarefas'
        },
        {
            title: 'Estoque',
            icon: Package,
            color: 'orange',
            stats: [
                { label: 'Alertas Ativos', value: stats.estoque.alertas, highlight: true },
                { label: 'Críticos', value: stats.estoque.criticos, urgent: true }
            ],
            link: '/estoque/mp'
        },
        {
            title: 'Expedição',
            icon: Truck, // Precisa importar Truck
            color: 'indigo',
            stats: [
                { label: 'Nova Carga', value: 'Criar', highlight: true },
                { label: 'Pendências', value: 'Ver', highlight: false }
            ],
            link: '/expedicao/nova'
        }
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; text: string; border: string }> = {
            red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
            teal: { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200' },
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
            indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' }
        };
        return colors[color] || colors.blue;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-bold text-neutral-900">Dashboard Global</h1>
                <p className="text-neutral-500">Visão geral de todos os módulos do sistema</p>
            </header>

            {/* Cards de Módulos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Widgets Customizados - Vendas e Checklist */}
                <VendasSummary />
                <ChecklistSummary />

                {/* Cards Genéricos (já existentes) */}
                {cards.map((card) => {
                    // ...
                    const Icon = card.icon;
                    const colors = getColorClasses(card.color);

                    return (
                        <div
                            key={card.title}
                            onClick={() => navigate(card.link)}
                            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800">{card.title}</h3>
                                <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                                    <Icon className={colors.text} size={20} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                {card.stats.map((stat, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">{stat.label}</span>
                                        <span className={`text-lg font-black ${stat.urgent ? 'text-red-600' :
                                            stat.highlight ? colors.text :
                                                'text-slate-800'
                                            }`}>
                                            {stat.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Alertas Críticos e Ações Prioritárias */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ações Prioritárias */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                            <Clock className="text-teal-600" size={24} />
                            Prioridades do Dia
                        </h2>
                        <button
                            onClick={() => navigate('/minhas-tarefas')}
                            className="text-xs font-black text-teal-600 uppercase tracking-widest hover:underline"
                        >
                            Ver Todas
                        </button>
                    </div>

                    <div className="space-y-3">
                        {prioridades.length > 0 ? prioridades.map(acao => (
                            <div
                                key={acao.id}
                                onClick={() => navigate(acao.origem === 'QUALIDADE' ? '/qualidade/planos-acao' : `/projetos/detalhes/${acao.id.split('-')[0]}`)}
                                className="flex items-center justify-between p-4 bg-slate-50 border border-transparent hover:border-teal-200 hover:bg-white transition-all rounded-xl cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <div>
                                        <p className="text-sm font-black text-slate-700 uppercase tracking-tight group-hover:text-teal-700">{acao.titulo}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{acao.origem}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className={`text-[10px] font-black uppercase ${new Date(acao.prazo) < new Date() ? 'text-red-500' : 'text-slate-400'}`}>
                                                Prazo: {new Date(acao.prazo).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        )) : (
                            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <CheckSquare size={40} className="mx-auto text-slate-200 mb-2" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tudo em dia por aqui!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Alertas Ativos */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                            <AlertCircle className="text-red-600" size={24} />
                            Atenção Crítica
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-5 rounded-2xl border transition-all ${stats.ncs.criticas > 0 ? 'bg-red-50 border-red-200 shadow-sm shadow-red-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">NCs Críticas</p>
                            <p className="text-3xl font-black text-slate-800 leading-none">{stats.ncs.criticas}</p>
                        </div>
                        <div className={`p-5 rounded-2xl border transition-all ${stats.projetos.atrasados > 0 ? 'bg-orange-50 border-orange-200 shadow-sm shadow-orange-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Prazos Atrasados</p>
                            <p className="text-3xl font-black text-slate-800">{stats.projetos.atrasados + stats.tarefas.atrasadas}</p>
                        </div>
                        <div className={`p-5 rounded-2xl border transition-all ${stats.estoque.criticos > 0 ? 'bg-amber-50 border-amber-200 shadow-sm shadow-amber-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Estoque Crítico</p>
                            <p className="text-3xl font-black text-slate-800">{stats.estoque.criticos}</p>
                        </div>
                        <div className="p-5 rounded-2xl border bg-slate-50 border-slate-100 opacity-60">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Manutenção</p>
                            <p className="text-3xl font-black text-slate-800">2</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/qualidade/nao-conformidades')}
                        className="w-full mt-6 py-4 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98]"
                    >
                        Tratar Riscos
                    </button>
                </div>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest">Módulos do Sistema</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Qualidade', icon: FileText, path: '/qualidade/nao-conformidades', color: 'text-red-600' },
                        { label: 'Projetos', icon: FolderKanban, path: '/projetos/dashboard', color: 'text-teal-600' },
                        { label: 'Estoque', icon: Package, path: '/estoque/dashboard', color: 'text-orange-600' },
                        { label: 'PCP', icon: BarChart3, path: '/pcp', color: 'text-blue-600' },
                        { label: 'Expedição', icon: Truck, path: '/expedicao/carga', color: 'text-indigo-600' },
                        { label: 'Manutenção', icon: Wrench, path: '/manutencao', color: 'text-slate-600' },
                    ].map(item => (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className="p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-teal-200 hover:shadow-xl hover:shadow-teal-600/5 transition-all group text-center flex flex-col items-center gap-3"
                        >
                            <item.icon size={28} className={`${item.color} group-hover:scale-110 transition-transform`} />
                            <p className="text-xs font-black text-slate-700 uppercase tracking-wider">{item.label}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardGlobal;
