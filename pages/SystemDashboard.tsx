import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShieldCheck,
    ClipboardList, PenTool, Truck,
    ChevronRight, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SystemDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const modules = [
        {
            title: 'Estoque & Produção',
            description: 'Gestão de materiais, fórmulas e PCP',
            icon: Package,
            color: 'bg-emerald-500',
            path: '/estoque/dashboard',
            stats: '12 Low Stock'
        },
        {
            title: 'Qualidade',
            description: 'Controle de não conformidades e planos',
            icon: ShieldCheck,
            color: 'bg-blue-500',
            path: '/qualidade/nao-conformidades',
            stats: '3 Pendentes'
        },
        {
            title: 'Projetos',
            description: 'Gestão de tarefas e cronogramas',
            icon: ClipboardList,
            color: 'bg-violet-500',
            path: '/projetos/dashboard',
            stats: '5 Ativos'
        },
        {
            title: 'Manutenção',
            description: 'Gestão de máquinas e ordens de serviço',
            icon: PenTool,
            color: 'bg-orange-500',
            path: '/manutencao/dashboard',
            stats: '1 Urgente'
        },
        {
            title: 'Frotas',
            description: 'Controle de veículos e abastecimentos',
            icon: Truck,
            color: 'bg-slate-600',
            path: '/frotas/dashboard',
            stats: 'OK'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"></div>

                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                        Olá, {user?.name?.split(' ')[0] || 'Gestor'}! 👋
                    </h1>
                    <p className="text-slate-400 text-lg font-medium max-w-xl">
                        Bem-vindo ao SystemQuartz. Tudo parece estar operando normalmente hoje.
                    </p>

                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={() => navigate('/minhas-tarefas')}
                            className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
                        >
                            Minhas Tarefas <ArrowUpRight size={18} />
                        </button>
                        <button
                            onClick={() => navigate('/perfil')}
                            className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors backdrop-blur-sm"
                        >
                            Meu Perfil
                        </button>
                    </div>
                </div>
            </div>

            {/* Modules Grid - Bento Style */}
            <div>
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                    <LayoutDashboard className="text-teal-600" />
                    Acesso Rápido aos Módulos
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module, index) => (
                        <div
                            key={module.title}
                            onClick={() => navigate(module.path)}
                            className={`
                group relative overflow-hidden rounded-[2rem] bg-white p-6 
                border-2 border-slate-100 dark:border-slate-800
                hover:border-teal-500/30 transition-all duration-300
                hover:shadow-2xl hover:shadow-teal-500/10 cursor-pointer
                ${index === 0 ? 'md:col-span-2 lg:col-span-1 lg:row-span-2' : ''}
              `}
                        >
                            <div className={`
                absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 
                transition-opacity duration-300 transform group-hover:scale-110
              `}>
                                <module.icon size={120} />
                            </div>

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className={`
                    w-12 h-12 rounded-2xl ${module.color} flex items-center justify-center 
                    text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300
                  `}>
                                        <module.icon size={24} />
                                    </div>

                                    <h3 className="text-xl font-black text-slate-800 mb-1">
                                        {module.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                        {module.description}
                                    </p>
                                </div>

                                <div className="mt-8 flex items-center justify-between">
                                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        {module.stats}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SystemDashboard;
