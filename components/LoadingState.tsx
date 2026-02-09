import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

/**
 * Loading State Component
 * 
 * Componente reutilizável para exibir estados de carregamento
 * 
 * Uso:
 * <LoadingState message="Carregando dados..." />
 * <LoadingState size="lg" fullScreen />
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
    message = 'Carregando...',
    size = 'md',
    fullScreen = false
}) => {
    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16'
    };

    const containerClasses = fullScreen
        ? 'min-h-screen flex items-center justify-center'
        : 'flex items-center justify-center h-64';

    return (
        <div className={containerClasses}>
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <Loader2
                        className={`${sizeClasses[size]} text-teal-600 animate-spin`}
                    />
                </div>
                <p className="text-slate-600 font-medium">{message}</p>
            </div>
        </div>
    );
};

/**
 * Loading Spinner (apenas o spinner, sem container)
 */
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    };

    return (
        <Loader2 className={`${sizeClasses[size]} text-teal-600 animate-spin`} />
    );
};

/**
 * Skeleton Loader (para cards/listas)
 */
export const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 3 }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 bg-slate-200 rounded-xl"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                        <div className="h-3 bg-slate-200 rounded w-4/6"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LoadingState;
