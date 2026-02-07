import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 5000) => {
        const id = Math.random().toString(36).substring(7);
        const toast: Toast = { id, type, title, message, duration };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const success = useCallback((title: string, message?: string) => {
        showToast('success', title, message);
    }, [showToast]);

    const error = useCallback((title: string, message?: string) => {
        showToast('error', title, message, 7000);
    }, [showToast]);

    const warning = useCallback((title: string, message?: string) => {
        showToast('warning', title, message);
    }, [showToast]);

    const info = useCallback((title: string, message?: string) => {
        showToast('info', title, message);
    }, [showToast]);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} />;
            case 'error': return <XCircle size={20} />;
            case 'warning': return <AlertCircle size={20} />;
            case 'info': return <Info size={20} />;
        }
    };

    const getColors = (type: ToastType) => {
        switch (type) {
            case 'success': return 'bg-green-50 border-green-200 text-green-800';
            case 'error': return 'bg-red-50 border-red-200 text-red-800';
            case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    const getIconColor = (type: ToastType) => {
        switch (type) {
            case 'success': return 'text-green-600';
            case 'error': return 'text-red-600';
            case 'warning': return 'text-orange-600';
            case 'info': return 'text-blue-600';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[200] space-y-2 max-w-md">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`${getColors(toast.type)} border rounded-xl p-4 shadow-lg animate-slide-in-right flex items-start gap-3`}
                    >
                        <div className={getIconColor(toast.type)}>
                            {getIcon(toast.type)}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm">{toast.title}</h4>
                            {toast.message && (
                                <p className="text-xs mt-1 opacity-90">{toast.message}</p>
                            )}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-current opacity-50 hover:opacity-100 transition"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </ToastContext.Provider>
    );
};
