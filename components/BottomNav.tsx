import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, AlertTriangle, Home, User } from 'lucide-react';

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        {
            id: 'home',
            label: 'Início',
            icon: Home,
            path: '/',
            color: 'text-blue-600'
        },
        {
            id: 'estoque',
            label: 'Estoque',
            icon: Package,
            path: '/estoque/dashboard',
            color: 'text-blue-600'
        },
        {
            id: 'qualidade',
            label: 'Qualidade',
            icon: AlertTriangle,
            path: '/qualidade/nao-conformidades',
            color: 'text-red-600'
        },
        {
            id: 'perfil',
            label: 'Perfil',
            icon: User,
            path: '/perfil',
            color: 'text-slate-600'
        }
    ];

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* Bottom Navigation - Mobile Only */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-inset-bottom">
                <div className="grid grid-cols-4 h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={`
                  flex flex-col items-center justify-center gap-1 transition-colors duration-200
                  ${active ? item.color + ' font-semibold' : 'text-slate-400'}
                  active:bg-slate-50
                `}
                            >
                                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                                <span className="text-xs">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Spacer for Bottom Nav - Mobile Only */}
            <div className="md:hidden h-16"></div>
        </>
    );
};

export default BottomNav;
