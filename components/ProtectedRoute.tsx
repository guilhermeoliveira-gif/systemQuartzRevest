import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
    const { user, loading } = useAuth();

    // Check for "demo mode" bypass in localStorage
    const isDemo = localStorage.getItem('antigravity_auth') === 'true';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                    <p className="text-slate-500 font-medium">Carregando sistema...</p>
                </div>
            </div>
        );
    }

    if (!user && !isDemo) {
        return <Navigate to="/auth/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
