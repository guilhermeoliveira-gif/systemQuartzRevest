import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const getColors = () => {
        switch (variant) {
            case 'danger':
                return {
                    bg: 'bg-red-100',
                    text: 'text-red-600',
                    button: 'bg-red-600 hover:bg-red-700'
                };
            case 'warning':
                return {
                    bg: 'bg-orange-100',
                    text: 'text-orange-600',
                    button: 'bg-orange-600 hover:bg-orange-700'
                };
            case 'info':
                return {
                    bg: 'bg-blue-100',
                    text: 'text-blue-600',
                    button: 'bg-blue-600 hover:bg-blue-700'
                };
        }
    };

    const colors = getColors();

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[151] px-4">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-scale-in">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                                <AlertTriangle className={colors.text} size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-slate-400 hover:text-slate-600 transition"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <p className="text-slate-600 mb-6">{message}</p>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onCancel();
                            }}
                            className={`flex-1 px-4 py-2 ${colors.button} text-white rounded-lg font-bold transition`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scale-in {
                    from {
                        transform: translate(-50%, -50%) scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }
            `}</style>
        </>
    );
};

export default ConfirmDialog;
