import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import AIChatAssistant from '../components/AIChatAssistant';
import NotificationBell from '../components/NotificationBell';
import GlobalSearch from '../components/GlobalSearch';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAuth } from '../contexts/AuthContext';
import { Cpu, Search } from 'lucide-react';

const MainLayout: React.FC = () => {
    const { signOut, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        signOut();
        localStorage.removeItem('antigravity_auth');
        window.location.reload();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={24} />
                </div>
                <p className="mt-4 text-slate-600 font-medium animate-pulse">Iniciando sistema...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-neutral-900 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden bg-white text-slate-900 p-4 flex justify-between items-center sticky top-0 z-50 border-b border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                        <Cpu size={20} />
                    </div>
                    <span className="text-lg font-black tracking-tighter uppercase">QuartzRevest</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <Search size={22} />
                    </button>
                    <NotificationBell />
                </div>
            </header>

            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar Navigation - Desktop Only */}
            <aside className={`
                fixed md:relative z-50 w-64 h-full bg-slate-900 text-white flex-shrink-0 transition-transform duration-300
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                hidden md:block shadow-xl border-r border-slate-800
            `}>
                <Sidebar onLogout={handleLogout} onCloseSidebar={() => setIsSidebarOpen(false)} />
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden min-h-screen p-4 md:p-8 lg:p-10 bg-slate-50 pb-20 md:pb-8">
                <Breadcrumbs />
                <Outlet />
            </main>

            {/* Bottom Navigation - Mobile Only */}
            <BottomNav />

            {/* AI Chat Assistant - Hidden on small screens */}
            <div className="hidden lg:block">
                <AIChatAssistant />
            </div>

            {/* Global Search (Ctrl+K) */}
            <GlobalSearch />
        </div>
    );
};

export default MainLayout;
