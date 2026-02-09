import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

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
    const [users, setUsers] = useState<{ id: string, nome: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('id, nome')
                    .eq('ativo', true)
                    .order('nome');

                if (error) throw error;
                if (data) setUsers(data);
            } catch (error) {
                console.error("Erro ao buscar usuários:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
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
