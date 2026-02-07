import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Package, AlertTriangle, Home, User,
    LayoutDashboard, Box, FlaskConical, Warehouse, Factory,
    ClipboardCheck, BarChart, Settings, Wrench, X, ChevronUp
} from 'lucide-react';

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeMenu, setActiveMenu] = useState<'estoque' | 'qualidade' | null>(null);

    const stockItems = [
        { name: 'Dashboard', path: '/estoque/dashboard', icon: LayoutDashboard },
        { name: 'Matéria-Prima', path: '/estoque/cadastro/mp', icon: Package },
        { name: 'Produto Acabado', path: '/estoque/cadastro/pa', icon: Box },
        { name: 'Peças e Insumos', path: '/estoque/pecas', icon: Wrench },
        { name: 'Fórmulas', path: '/estoque/cadastro/formula', icon: FlaskConical },
        { name: 'Entrada Material', path: '/estoque/entrada-material', icon: Warehouse },
        { name: 'Produção', path: '/estoque/controle-producao', icon: Factory },
        { name: 'Conferência', path: '/estoque/conferencia', icon: ClipboardCheck },
        { name: 'Relatórios', path: '/estoque/relatorios', icon: BarChart },
        { name: 'Configurações', path: '/estoque/configuracoes', icon: Settings },
    ];

    const qualityItems = [
        { name: 'Não Conformidades', path: '/qualidade/nao-conformidades', icon: AlertTriangle },
        { name: 'Planos de Ação', path: '/qualidade/planos-acao', icon: ClipboardCheck },
        { name: 'Configurações', path: '/qualidade/configuracoes', icon: Settings },
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
        setActiveMenu(null);
    };

    const toggleMenu = (menu: 'estoque' | 'qualidade') => {
        if (activeMenu === menu) {
            setActiveMenu(null);
        } else {
            setActiveMenu(menu);
        }
    };

    const isPathActive = (path: string) => location.pathname === path;
    const isModuleActive = (module: string) => location.pathname.startsWith(`/${module}`);

    return (
        <>
            {/* Mobile Menu Overlay */}
            {activeMenu && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setActiveMenu(null)}>
                    <div
                        className="absolute bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-2xl overflow-hidden max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                {activeMenu === 'estoque' ? <Package className="text-blue-600" /> : <AlertTriangle className="text-red-600" />}
                                Menu {activeMenu === 'estoque' ? 'Estoque' : 'Não Conformidade'}
                            </h3>
                            <button onClick={() => setActiveMenu(null)} className="p-1 rounded-full hover:bg-slate-200">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-2 space-y-1">
                            {(activeMenu === 'estoque' ? stockItems : qualityItems).map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => handleNavigation(item.path)}
                                    className={`
                                        w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors
                                        ${isPathActive(item.path)
                                            ? (activeMenu === 'estoque' ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-red-50 text-red-700 font-bold')
                                            : 'text-slate-600 hover:bg-slate-50'}
                                    `}
                                >
                                    <item.icon size={20} strokeWidth={isPathActive(item.path) ? 2.5 : 2} />
                                    <span>{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-inset-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="grid grid-cols-4 h-16">
                    {/* Home Button */}
                    <button
                        onClick={() => navigate('/')}
                        className={`flex flex-col items-center justify-center gap-1 ${location.pathname === '/' ? 'text-slate-900' : 'text-slate-400'}`}
                    >
                        <Home size={24} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">Início</span>
                    </button>

                    {/* Stock Menu Button */}
                    <button
                        onClick={() => toggleMenu('estoque')}
                        className={`flex flex-col items-center justify-center gap-1 ${activeMenu === 'estoque' || isModuleActive('estoque') ? 'text-blue-600' : 'text-slate-400'}`}
                    >
                        <div className="relative">
                            <Package size={24} strokeWidth={activeMenu === 'estoque' || isModuleActive('estoque') ? 2.5 : 2} />
                            {activeMenu === 'estoque' && (
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-medium flex items-center gap-0.5">
                            Estoque
                            <ChevronUp size={10} className={`transition-transform duration-200 ${activeMenu === 'estoque' ? 'rotate-180' : ''}`} />
                        </span>
                    </button>

                    {/* Quality Menu Button */}
                    <button
                        onClick={() => toggleMenu('qualidade')}
                        className={`flex flex-col items-center justify-center gap-1 ${activeMenu === 'qualidade' || isModuleActive('qualidade') ? 'text-red-600' : 'text-slate-400'}`}
                    >
                        <div className="relative">
                            <AlertTriangle size={24} strokeWidth={activeMenu === 'qualidade' || isModuleActive('qualidade') ? 2.5 : 2} />
                            {activeMenu === 'qualidade' && (
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-medium flex items-center gap-0.5">
                            Não Conf.
                            <ChevronUp size={10} className={`transition-transform duration-200 ${activeMenu === 'qualidade' ? 'rotate-180' : ''}`} />
                        </span>
                    </button>

                    {/* Profile Button */}
                    <button
                        onClick={() => navigate('/perfil')}
                        className={`flex flex-col items-center justify-center gap-1 ${location.pathname === '/perfil' ? 'text-slate-900' : 'text-slate-400'}`}
                    >
                        <User size={24} strokeWidth={location.pathname === '/perfil' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">Perfil</span>
                    </button>
                </div>
            </nav>

            {/* Spacer */}
            <div className="md:hidden h-20 safe-area-inset-bottom bg-slate-50"></div>
        </>
    );
};

export default BottomNav;
