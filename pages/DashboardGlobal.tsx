import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, FolderKanban, CheckSquare, Package, AlertCircle,
    TrendingUp, Clock, Users, BarChart3
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface DashboardStats {
    ncs: { total: number; abertas: number; criticas: number };
    projetos: { total: number; emAndamento: number; atrasados: number };
    tarefas: { total: number; pendentes: number; atrasadas: number };
    estoque: { alertas: number; criticos: number };
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

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);

            // Using Promise.allSettled to prevent one failure from breaking everything
            const [ncsResult, projetosResult, tarefasResult, estoqueResult] = await Promise.allSettled([
                supabase.from('nao_conformidade').select('status, severidade'),
                supabase.from('projeto').select('status, data_fim_prevista'),
                supabase.from('tarefas_unificadas').select('status, prazo'),
                supabase.from('alerta_estoque').select('nivel_alerta').is('resolved_at', null)
            ]);

            // NCs
            let ncsStats = { total: 0, abertas: 0, criticas: 0 };
            if (ncsResult.status === 'fulfilled' && ncsResult.value.data) {
                const ncs = ncsResult.value.data;
                ncsStats = {
                    total: ncs.length,
                    abertas: ncs.filter(nc => nc.status === 'ABERTA').length,
                    criticas: ncs.filter(nc => nc.severidade === 'CRITICA').length
                };
            }

            // Projetos
            let projetosStats = { total: 0, emAndamento: 0, atrasados: 0 };
            if (projetosResult.status === 'fulfilled' && projetosResult.value.data) {
                const projetos = projetosResult.value.data;
                projetosStats = {
                    total: projetos.length,
                    emAndamento: projetos.filter(p => p.status === 'EM_ANDAMENTO').length,
                    atrasados: projetos.filter(p =>
                        p.status !== 'CONCLUIDO' && new Date(p.data_fim_prevista) < new Date()
                    ).length
                };
            }

            // Tarefas
            let tarefasStats = { total: 0, pendentes: 0, atrasadas: 0 };
            if (tarefasResult.status === 'fulfilled' && tarefasResult.value.data) {
                const tarefas = tarefasResult.value.data;
                tarefasStats = {
                    total: tarefas.length,
                    pendentes: tarefas.filter(t => t.status !== 'CONCLUIDA').length,
                    atrasadas: tarefas.filter(t =>
                        t.status !== 'CONCLUIDA' && new Date(t.prazo) < new Date()
                    ).length
                };
            }

            // Estoque
            let estoqueStats = { alertas: 0, criticos: 0 };
            if (estoqueResult.status === 'fulfilled' && estoqueResult.value.data) {
                const alertas = estoqueResult.value.data;
                estoqueStats = {
                    alertas: alertas.length,
                    criticos: alertas.filter(a => a.nivel_alerta === 'CRITICO').length
                };
            }

            setStats({ ncs: ncsStats, projetos: projetosStats, tarefas: tarefasStats, estoque: estoqueStats });
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Erro ao carregar estatísticas:', error);
            }
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
        }
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; text: string; border: string }> = {
            red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
            teal: { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200' },
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' }
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
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            <header>
                <h1 className="text-3xl font-bold text-neutral-900">Dashboard Global</h1>
                <p className="text-neutral-500">Visão geral de todos os módulos do sistema</p>
            </header>

            {/* Cards de Módulos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => {
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

            {/* Alertas Críticos */}
            {(stats.ncs.criticas > 0 || stats.projetos.atrasados > 0 || stats.tarefas.atrasadas > 0 || stats.estoque.criticos > 0) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="text-red-600" size={24} />
                        <h2 className="text-lg font-bold text-red-800">Atenção Necessária</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {stats.ncs.criticas > 0 && (
                            <div className="bg-white p-3 rounded-lg border border-red-200">
                                <p className="text-xs font-bold text-red-600 uppercase">NCs Críticas</p>
                                <p className="text-2xl font-black text-red-700">{stats.ncs.criticas}</p>
                            </div>
                        )}
                        {stats.projetos.atrasados > 0 && (
                            <div className="bg-white p-3 rounded-lg border border-red-200">
                                <p className="text-xs font-bold text-red-600 uppercase">Projetos Atrasados</p>
                                <p className="text-2xl font-black text-red-700">{stats.projetos.atrasados}</p>
                            </div>
                        )}
                        {stats.tarefas.atrasadas > 0 && (
                            <div className="bg-white p-3 rounded-lg border border-red-200">
                                <p className="text-xs font-bold text-red-600 uppercase">Tarefas Atrasadas</p>
                                <p className="text-2xl font-black text-red-700">{stats.tarefas.atrasadas}</p>
                            </div>
                        )}
                        {stats.estoque.criticos > 0 && (
                            <div className="bg-white p-3 rounded-lg border border-red-200">
                                <p className="text-xs font-bold text-red-600 uppercase">Estoque Crítico</p>
                                <p className="text-2xl font-black text-red-700">{stats.estoque.criticos}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Ações Rápidas */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Ações Rápidas</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                        onClick={() => navigate('/qualidade/cadastro-nc')}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-left"
                    >
                        <FileText size={20} className="text-red-600 mb-2" />
                        <p className="text-sm font-bold text-slate-800">Nova NC</p>
                    </button>
                    <button
                        onClick={() => navigate('/projetos/consulta')}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-left"
                    >
                        <FolderKanban size={20} className="text-teal-600 mb-2" />
                        <p className="text-sm font-bold text-slate-800">Novo Projeto</p>
                    </button>
                    <button
                        onClick={() => navigate('/projetos/tarefas-consulta')}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-left"
                    >
                        <CheckSquare size={20} className="text-blue-600 mb-2" />
                        <p className="text-sm font-bold text-slate-800">Nova Tarefa</p>
                    </button>
                    <button
                        onClick={() => navigate('/minhas-tarefas')}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-left"
                    >
                        <Clock size={20} className="text-orange-600 mb-2" />
                        <p className="text-sm font-bold text-slate-800">Minhas Tarefas</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardGlobal;
