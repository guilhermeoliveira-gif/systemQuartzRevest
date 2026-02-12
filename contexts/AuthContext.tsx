import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
    id: string;
    email: string;
    nome: string;
    cargo?: string;
    setor?: string;
    avatar_url?: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const isMounted = React.useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        // Aumentado para 15s para dar tempo ao banco em conexões lentas
        const safetyTimeout = setTimeout(() => {
            if (isMounted.current && loading) {
                console.warn('Authentication check timed out - force loading to false to unblock UI');
                setLoading(false);
            }
        }, 15000);

        const initAuth = async () => {
            try {
                // 1. Verificar sessão ativa
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;
                if (!isMounted.current) return;

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchUserProfile(session.user.id, session.user);
                } else {
                    setLoading(false);
                }
            } catch (err: any) {
                // Ignorar erros de aborto
                if (err.name === 'AbortError' || err.message?.includes('aborted')) return;

                console.error('Error checking session:', err);
                if (isMounted.current) setLoading(false);
            }
        };

        initAuth();

        // 2. Ouvir mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted.current) return;

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                // Busca perfil apenas se houver sessão para evitar chamadas vazias
                await fetchUserProfile(session.user.id, session.user);
            } else {
                setProfile(null);
                setLoading(false); // Garante que loading pare se não houver usuário
            }
        });

        return () => {
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserProfile = async (userId: string, currentUser?: User) => {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', userId)
                .single();

            if (!isMounted.current) return;

            if (error) {
                // Ignore minor errors or specific aborted requests
                if (error.code !== 'PGRST116') { // PGRST116 is "Row not found" - expected for new users
                    console.error('Erro ao buscar perfil:', error);
                }

                // Fallback if profile doesn't exist yet
                // Use currentUser passed as arg OR fallback to state user
                const userObj = currentUser || user;

                setProfile({
                    id: userId,
                    email: userObj?.email || '',
                    nome: userObj?.user_metadata?.nome || userObj?.email?.split('@')[0] || 'Usuário',
                });
            } else {
                setProfile(data);
            }
        } catch (error: any) {
            if (!isMounted.current) return;
            console.error('Erro inesperado ao buscar perfil:', error);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
