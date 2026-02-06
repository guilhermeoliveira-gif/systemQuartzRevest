import React from 'react';
import { Plus } from 'lucide-react';

interface FABProps {
    onClick: () => void;
    label?: string;
    icon?: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'danger';
}

const FAB: React.FC<FABProps> = ({
    onClick,
    label = 'Adicionar',
    icon,
    color = 'primary'
}) => {
    const colorClasses = {
        primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
        success: 'bg-green-600 hover:bg-green-700 active:bg-green-800',
        warning: 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800',
        danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800'
    };

    return (
        <button
            onClick={onClick}
            className={`
        fixed bottom-20 right-4 md:bottom-8 md:right-8
        flex items-center gap-3 px-6 py-4
        ${colorClasses[color]}
        text-white font-bold rounded-full shadow-lg
        transition-all duration-200
        hover:shadow-xl hover:scale-105
        active:scale-95
        z-40
      `}
            aria-label={label}
        >
            {icon || <Plus size={24} strokeWidth={2.5} />}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
};

export default FAB;
