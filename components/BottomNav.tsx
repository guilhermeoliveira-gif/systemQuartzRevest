import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, CheckSquare } from 'lucide-react';

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isPathActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const navItems = [
        {
            name: 'Início',
            path: '/',
            icon: Home,
            active: isPathActive('/')
        },
        {
            name: 'Minhas Tarefas',
            path: '/minhas-tarefas',
            icon: CheckSquare,
            active: isPathActive('/minhas-tarefas')
        },
        {
            name: 'Perfil',
            path: '/perfil',
            icon: User,
            active: isPathActive('/perfil')
        }
    ];

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-inset-bottom shadow-[0_-8px_20px_-6px_rgba(0,0,0,0.1)]">
                <div className="grid grid-cols-3 h-16 max-w-md mx-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 relative
                                ${item.active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <div className={`p-1 rounded-xl transition-colors ${item.active ? 'bg-blue-50' : 'bg-transparent'}`}>
                                <item.icon size={22} strokeWidth={item.active ? 2.5 : 2} />
                            </div>
                            <span className={`text-[10px] font-bold tracking-tight ${item.active ? 'text-blue-700' : 'text-slate-500'}`}>
                                {item.name}
                            </span>

                            {/* Active Indicator Dot */}
                            {item.active && (
                                <span className="absolute top-2 right-1/3 w-1.5 h-1.5 bg-blue-600 rounded-full border-2 border-white"></span>
                            )}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Spacer to prevent content from being hidden behind nav */}
            <div className="md:hidden h-20 safe-area-inset-bottom"></div>
        </>
    );
};

export default BottomNav;
