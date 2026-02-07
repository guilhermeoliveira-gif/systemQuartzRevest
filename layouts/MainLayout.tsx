import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import AIChatAssistant from '../components/AIChatAssistant';
import NotificationBell from '../components/NotificationBell';
import GlobalSearch from '../components/GlobalSearch';
import { useAuth } from '../contexts/AuthContext';
import { Cpu, Loader2 } from 'lucide-react';

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
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-blue-600" size={48} />
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
                <NotificationBell />
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
