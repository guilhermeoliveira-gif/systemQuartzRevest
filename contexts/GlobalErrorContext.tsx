import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AlertCircle, X, Copy, CheckCircle } from 'lucide-react';

interface GlobalErrorContextType {
    showError: (title: string, message: string, details?: string) => void;
    clearError: () => void;
}

const GlobalErrorContext = createContext<GlobalErrorContextType | undefined>(undefined);

export const useGlobalError = () => {
    const context = useContext(GlobalErrorContext);
    if (!context) {
        throw new Error('useGlobalError must be used within a GlobalErrorProvider');
    }
    return context;
};

interface GlobalErrorProviderProps {
    children: ReactNode;
}

export const GlobalErrorProvider: React.FC<GlobalErrorProviderProps> = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [details, setDetails] = useState<string | undefined>(undefined);
    const [copied, setCopied] = useState(false);

    const showError = (errorTitle: string, errorMessage: string, errorDetails?: string) => {
        setTitle(errorTitle);
        setMessage(errorMessage);
        setDetails(errorDetails);
        setIsVisible(true);
        console.error(`[GlobalError] ${errorTitle}: ${errorMessage}`, errorDetails);
    };

    const clearError = () => {
        setIsVisible(false);
        setTitle('');
        setMessage('');
        setDetails(undefined);
        setCopied(false);
    };

    const handleCopyError = () => {
        const textToCopy = `Título: ${title}\nMensagem: ${message}\nDetalhes:\n${details || 'N/A'}`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Global Event Listeners for Uncaught Errors
    useEffect(() => {
        const handlePromiseRejection = (event: PromiseRejectionEvent) => {
            // Extrair mensagem de erro útil de objetos ou strings
            let msg = 'Erro desconhecido em promessa';
            let stack = '';

            if (event.reason) {
                if (event.reason instanceof Error) {
                    msg = event.reason.message;
                    stack = event.reason.stack || '';
                } else if (typeof event.reason === 'string') {
                    msg = event.reason;
                } else {
                    try {
                        msg = JSON.stringify(event.reason);
                    } catch (e) {
                        msg = String(event.reason);
                    }
                }
            }

            showError('Erro de Execução (Async)', msg, stack);
        };

        const handleWindowError = (event: ErrorEvent) => {
            showError('Erro de Execução (Runtime)', event.message, event.error?.stack);
        };

        window.addEventListener('unhandledrejection', handlePromiseRejection);
        window.addEventListener('error', handleWindowError);

        return () => {
            window.removeEventListener('unhandledrejection', handlePromiseRejection);
            window.removeEventListener('error', handleWindowError);
        };
    }, []);

    // Interceptar console.error para pegar erros que frameworks engolem mas loggam
    // (Cuidado: isso pode ser ruidoso, talvez melhor deixar opcional ou filtrar)
    // Decisão: Vamos focar em unhandledrejection e error por enquanto.

    return (
        <GlobalErrorContext.Provider value={{ showError, clearError }}>
            {children}

            {/* Modal de Erro Global */}
            {isVisible && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-red-500 overflow-hidden animate-in zoom-in-95 duration-200"
                        role="alertdialog"
                    >
                        {/* Header */}
                        <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="text-white w-6 h-6" />
                                <h3 className="text-white font-bold text-lg">Ocorreu um Erro</h3>
                            </div>
                            <button
                                onClick={clearError}
                                className="text-white/80 hover:text-white hover:bg-red-700/50 rounded-lg p-1 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xl mb-2">
                                {title}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300 mb-6 border-l-4 border-red-400 pl-4 py-1 bg-red-50 dark:bg-red-900/10">
                                {message}
                            </p>

                            {details && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Detalhes Técnicos</span>
                                        <button
                                            onClick={handleCopyError}
                                            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
                                        >
                                            {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                                            {copied ? 'Copiado!' : 'Copiar Log'}
                                        </button>
                                    </div>
                                    <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto border border-slate-800 shadow-inner">
                                        <pre className="text-xs font-mono text-red-300 whitespace-pre-wrap break-all">
                                            {details}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Recarregar Página
                            </button>
                            <button
                                onClick={clearError}
                                className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </GlobalErrorContext.Provider>
    );
};
