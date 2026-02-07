
import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

interface AlertDialogProps extends DialogProps {
    description: string;
    onConfirm: () => void;
    cancelText?: string;
    confirmText?: string;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ isOpen, onClose, title, description, onConfirm, cancelText = "Cancelar", confirmText = "Excluir" }) => {
    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose}>{cancelText}</Button>
                    <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
                </div>
            </div>
        </Dialog>
    );
};
