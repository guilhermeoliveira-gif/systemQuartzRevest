// @ts-nocheck
import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '../utils/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

/**
 * Error Boundary Component
 * 
 * Captura erros em componentes filhos e exibe UI de fallback
 * em vez de crashar toda a aplicação.
 * 
 * Uso:
 * <ErrorBoundary>
 *   <SeuComponente />
 * </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log do erro
        logger.error('ErrorBoundary caught error', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });

        // Callback customizado
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Atualizar state com informações do erro
        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Fallback customizado
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Fallback padrão
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                    <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-red-100 p-4 rounded-2xl">
                                <AlertTriangle className="text-red-600" size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800">
                                    Ops! Algo deu errado
                                </h1>
                                <p className="text-slate-500 font-medium">
                                    Encontramos um erro inesperado
                                </p>
                            </div>
                        </div>

                        {/* Mensagem de Erro */}
                        {this.state.error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                                <p className="text-sm font-mono text-red-800">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        {/* Detalhes (apenas em desenvolvimento) */}
                        {import.meta.env.DEV && this.state.error && (
                            <details className="mb-6">
                                <summary className="cursor-pointer text-sm font-bold text-slate-600 hover:text-slate-800 mb-2">
                                    Detalhes técnicos (desenvolvimento)
                                </summary>
                                <div className="bg-slate-900 rounded-xl p-4 overflow-auto max-h-64">
                                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                                        {this.state.error.stack}
                                    </pre>
                                    {this.state.errorInfo && (
                                        <pre className="text-xs text-blue-400 font-mono whitespace-pre-wrap mt-4">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            </details>
                        )}

                        {/* Ações */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors"
                            >
                                <RefreshCw size={20} />
                                Tentar Novamente
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                            >
                                Recarregar Página
                            </button>
                        </div>

                        {/* Suporte */}
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <p className="text-sm text-slate-500 text-center">
                                Se o problema persistir, entre em contato com o suporte técnico.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
