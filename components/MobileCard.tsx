import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MobileCardProps {
    title: string;
    subtitle?: string;
    badge?: {
        text: string;
        color: 'success' | 'warning' | 'danger' | 'info';
    };
    icon?: LucideIcon;
    onClick?: () => void;
    children?: React.ReactNode;
    className?: string;
}

const MobileCard: React.FC<MobileCardProps> = ({
    title,
    subtitle,
    badge,
    icon: Icon,
    onClick,
    children,
    className = ''
}) => {
    const badgeColors = {
        success: 'bg-green-100 text-green-700 border-green-200',
        warning: 'bg-orange-100 text-orange-700 border-orange-200',
        danger: 'bg-red-100 text-red-700 border-red-200',
        info: 'bg-blue-100 text-blue-700 border-blue-200'
    };

    return (
        <div
            onClick={onClick}
            className={`
        bg-white rounded-xl shadow-sm border border-slate-200
        p-4 transition-all duration-200
        ${onClick ? 'cursor-pointer active:scale-[0.98] hover:shadow-md' : ''}
        ${className}
      `}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    {/* Badge */}
                    {badge && (
                        <span className={`
              inline-block px-3 py-1 rounded-full text-xs font-bold border mb-2
              ${badgeColors[badge.color]}
            `}>
                            {badge.text}
                        </span>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1 line-clamp-2">
                        {title}
                    </h3>

                    {/* Subtitle */}
                    {subtitle && (
                        <p className="text-sm text-slate-500 line-clamp-1">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Icon */}
                {Icon && (
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Icon size={20} className="text-blue-600" />
                    </div>
                )}
            </div>

            {/* Content */}
            {children && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                    {children}
                </div>
            )}
        </div>
    );
};

export default MobileCard;
