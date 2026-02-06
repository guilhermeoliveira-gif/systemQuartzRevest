import React from 'react';
import { CheckCircle, Clock, XCircle, AlertTriangle, Play } from 'lucide-react';

interface StatusBadgeProps {
    status: 'EM_ANALISE' | 'ACAO_DEFINIDA' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'CANCELADO' | 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'VERIFICADA';
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
    const config = {
        EM_ANALISE: {
            label: 'Em Análise',
            color: 'bg-blue-100 text-blue-700 border-blue-200',
            icon: Clock
        },
        ACAO_DEFINIDA: {
            label: 'Ação Definida',
            color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            icon: AlertTriangle
        },
        EM_EXECUCAO: {
            label: 'Em Execução',
            color: 'bg-orange-100 text-orange-700 border-orange-200',
            icon: Play
        },
        CONCLUIDO: {
            label: 'Concluído',
            color: 'bg-green-100 text-green-700 border-green-200',
            icon: CheckCircle
        },
        CANCELADO: {
            label: 'Cancelado',
            color: 'bg-red-100 text-red-700 border-red-200',
            icon: XCircle
        },
        PENDENTE: {
            label: 'Pendente',
            color: 'bg-slate-100 text-slate-700 border-slate-200',
            icon: Clock
        },
        EM_ANDAMENTO: {
            label: 'Em Andamento',
            color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            icon: Play
        },
        CONCLUIDA: {
            label: 'Concluída',
            color: 'bg-green-100 text-green-700 border-green-200',
            icon: CheckCircle
        },
        VERIFICADA: {
            label: 'Verificada',
            color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            icon: CheckCircle
        }
    };

    const { label, color, icon: Icon } = config[status];

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    return (
        <span className={`
      inline-flex items-center gap-1.5 rounded-full font-bold border
      ${color}
      ${sizeClasses[size]}
    `}>
            {showIcon && <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />}
            {label}
        </span>
    );
};

export default StatusBadge;
