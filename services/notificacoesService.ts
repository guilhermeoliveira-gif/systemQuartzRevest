import { supabase } from './supabaseClient';
import { Notificacao, TarefaUnificada, TipoNotificacao, PrioridadeNotificacao } from '../types_notificacoes';

export const notificacoesService = {
    // ==================== NOTIFICAÇÕES ====================

    async getNotificacoes(limit: number = 50): Promise<Notificacao[]> {
        try {
            const { data, error } = await supabase
                .from('notificacao')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                if (error.message && error.message.includes('AbortError')) return [];
                console.error('Erro ao buscar notificações:', error);
                throw error;
            }

            return data || [];
        } catch (error: any) {
            if (error.name === 'AbortError' || error.message?.includes('AbortError')) return [];
            throw error;
        }
    },

    async getNotificacoesNaoLidas(): Promise<Notificacao[]> {
        try {
            const { data, error } = await supabase
                .from('notificacao')
                .select('*')
                .eq('lida', false)
                .order('created_at', { ascending: false });

            if (error) {
                if (error.message && error.message.includes('AbortError')) return [];
                console.error('Erro ao buscar notificações não lidas:', error);
                throw error;
            }

            return data || [];
        } catch (error: any) {
            if (error.name === 'AbortError' || error.message?.includes('AbortError')) return [];
            throw error;
        }
    },

    async contarNaoLidas(): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('notificacao')
                .select('*', { count: 'exact', head: true })
                .eq('lida', false);

            if (error) {
                if (error.message && error.message.includes('AbortError')) return 0;
                console.error('Erro ao contar notificações:', error);
                return 0;
            }

            return count || 0;
        } catch (error: any) {
            if (error.name === 'AbortError' || error.message?.includes('AbortError')) return 0;
            return 0;
        }
    },

    async marcarComoLida(id: string): Promise<void> {
        const { error } = await supabase.rpc('marcar_notificacao_lida', {
            p_notificacao_id: id
        });

        if (error) {
            console.error('Erro ao marcar notificação como lida:', error);
            throw error;
        }
    },

    async marcarTodasComoLidas(): Promise<void> {
        const { error } = await supabase.rpc('marcar_todas_lidas');

        if (error) {
            console.error('Erro ao marcar todas como lidas:', error);
            throw error;
        }
    },

    async criarNotificacao(
        usuarioId: string,
        tipo: TipoNotificacao,
        titulo: string,
        mensagem: string,
        link?: string,
        prioridade: PrioridadeNotificacao = 'NORMAL',
        metadata?: Record<string, any>
    ): Promise<string> {
        const { data, error } = await supabase.rpc('criar_notificacao', {
            p_usuario_id: usuarioId,
            p_tipo: tipo,
            p_titulo: titulo,
            p_mensagem: mensagem,
            p_link: link,
            p_prioridade: prioridade,
            p_metadata: metadata || {}
        });

        if (error) {
            console.error('Erro ao criar notificação:', error);
            throw error;
        }

        return data;
    },

    // ==================== TAREFAS UNIFICADAS ====================

    async getTarefasUnificadas(): Promise<TarefaUnificada[]> {
        const { data, error } = await supabase
            .from('tarefas_unificadas')
            .select(`
                *,
                responsavel:usuarios(id, nome, email)
            `)
            .order('prazo', { ascending: true });

        if (error) {
            console.error('Erro ao buscar tarefas unificadas:', error);
            throw error;
        }

        return data as any || [];
    },

    async getMinhasTarefas(): Promise<TarefaUnificada[]> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return [];
        }

        const { data, error } = await supabase
            .from('tarefas_unificadas')
            .select(`
                *,
                responsavel:usuarios(id, nome, email)
            `)
            .eq('responsavel_id', user.id)
            .order('prazo', { ascending: true });

        if (error) {
            console.error('Erro ao buscar minhas tarefas:', error);
            throw error;
        }

        return data as any || [];
    },

    async getTarefasPorStatus(status: string): Promise<TarefaUnificada[]> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return [];
        }

        const { data, error } = await supabase
            .from('tarefas_unificadas')
            .select(`
                *,
                responsavel:usuarios(id, nome, email)
            `)
            .eq('responsavel_id', user.id)
            .eq('status', status)
            .order('prazo', { ascending: true });

        if (error) {
            console.error('Erro ao buscar tarefas por status:', error);
            throw error;
        }

        return data as any || [];
    },

    async getTarefasAtrasadas(): Promise<TarefaUnificada[]> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return [];
        }

        const hoje = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('tarefas_unificadas')
            .select(`
                *,
                responsavel:usuarios(id, nome, email)
            `)
            .eq('responsavel_id', user.id)
            .lt('prazo', hoje)
            .not('status', 'in', '(CONCLUIDA,CANCELADA)')
            .order('prazo', { ascending: true });

        if (error) {
            console.error('Erro ao buscar tarefas atrasadas:', error);
            throw error;
        }

        return data as any || [];
    },

    // ==================== REALTIME SUBSCRIPTIONS ====================

    subscribeToNotificacoes(callback: (notificacao: Notificacao) => void) {
        return supabase
            .channel('notificacoes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notificacao'
                },
                (payload) => {
                    callback(payload.new as Notificacao);
                }
            )
            .subscribe();
    }
};
