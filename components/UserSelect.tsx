import React, { useEffect, useState } from 'react';
import { segurancaService } from '../services/segurancaService';

interface UserSelectProps {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
    className?: string;
    placeholder?: string;
}

export const UserSelect: React.FC<UserSelectProps> = ({
    value,
    onChange,
    label = "Responsável",
    required = false,
    className = "",
    placeholder = "Selecione..."
}) => {
    const [users, setUsers] = useState<{ id: string, nome: string, ativo: boolean }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchUsers = async () => {
            try {
                // Use cached service to avoid redundant network calls
                const allUsers = await segurancaService.getUsuarios();

                // Filter only active users for selection (allow null/undefined as true)
                if (isMounted) {
                    const activeUsers = allUsers.filter(u => u.ativo !== false);
                    console.log('UserSelect loaded users:', activeUsers.length, activeUsers);
                    setUsers(activeUsers);
                }
            } catch (error) {
                console.error("Erro ao carregar lista de usuários:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchUsers();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className={className}>
            {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label} {required && '*'}</label>}
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                disabled={loading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
                <option value="">{loading ? 'Carregando...' : placeholder}</option>
                {users.map(u => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
            </select>
        </div>
    );
};
