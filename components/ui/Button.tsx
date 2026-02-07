
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'ghost' | 'outline' | 'danger';
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'default', className = '', children, ...props }) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 px-4 py-2 sm:px-2 sm:py-1 md:px-4 md:py-2 active:scale-95";

    const variants = {
        default: "bg-blue-800 text-white hover:bg-blue-900 shadow",
        ghost: "hover:bg-slate-100 hover:text-slate-900",
        outline: "border border-slate-200 bg-white hover:bg-slate-100",
        danger: "bg-red-500 text-white hover:bg-red-600"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
