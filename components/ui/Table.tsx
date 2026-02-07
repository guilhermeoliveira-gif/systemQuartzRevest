
import React from 'react';

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className="relative w-full overflow-auto">
        <table className={`w-full caption-bottom text-sm ${className}`}>
            {children}
        </table>
    </div>
);

export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <thead className="[&_tr]:border-b bg-slate-50/50">
        {children}
    </thead>
);

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <tbody className="[&_tr:last-child]:border-0">
        {children}
    </tbody>
);

export const TableRow: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
    <tr
        onClick={onClick}
        className={`border-b transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-100 ${className}`}
    >
        {children}
    </tr>
);

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <th className={`h-12 px-4 text-left align-middle font-bold text-slate-500 uppercase tracking-tighter text-[10px] ${className}`}>
        {children}
    </th>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <th className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium ${className}`}>
        {children}
    </th>
);
