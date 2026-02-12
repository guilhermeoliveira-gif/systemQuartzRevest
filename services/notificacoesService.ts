import { supabase } from './supabaseClient';
import { prisma } from '../lib/prisma';
import { Notificacao, TarefaUnificada, TipoNotificacao, PrioridadeNotificacao } from '../types_notificacoes';
import { logger } from '../utils/logger';

export const notificacoesService = {
    // ==================== NOTIFICAÇÕES ====================

    async getNotificacoes(limit: number = 50): Promise<Notificacao[]> {
        const data = await prisma.notificacao.findMany({
            orderBy: { created_at: 'desc' },
            take: limit
        });
        return data as unknown as Notificacao[];
    },

    async getNotificacoesNaoLidas(): Promise<Notificacao[]> {
        const data = await prisma.notificacao.findMany({
            where: { lida: false },
            orderBy: { created_at: 'desc' }
        });
        return data as unknown as Notificacao[];
    },

    async contarNaoLidas(): Promise<number> {
        return await prisma.notificacao.count({
            where: { lida: false }
        });
    },

    async marcarComoLida(id: string): Promise<void> {
        await prisma.notificacao.update({
            where: { id },
            data: { lida: true, data_leitura: new Date() }
        });
    },

    async marcarTodasComoLidas(): Promise<void> {
        // Obter usuário atual do Supabase Auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await prisma.notificacao.updateMany({
            where: { usuario_id: user.id, lida: false },
            data: { lida: true, data_leitura: new Date() }
        });
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
        const data = await prisma.notificacao.create({
            data: {
                id: crypto.randomUUID(),
                usuarios_usuario_id: { connect: { id: usuarioId } },
                tipo,
                titulo,
                mensagem,
                link,
                prioridade,
                metadata: metadata || {},
                lida: false
            }
        });
        return data.id;
    },

    // ==================== TAREFAS UNIFICADAS ====================
    // Nota: Como 'tarefas_unificadas' é uma VIEW no Supabase e pode não estar mapeada no Prisma,
    // manteremos o uso do Supabase client para as tarefas unificadas por enquanto para evitar erros de schema.

    async getTarefasUnificadas(): Promise<TarefaUnificada[]> {
        const { data, error } = await supabase
            .from('tarefas_unificadas')
            .select(`
                *,
                responsavel:usuarios(id, nome, email)
            `)
            .order('prazo', { ascending: true });

        if (error) {
            logger.error('Erro ao buscar tarefas unificadas:', error);
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
            logger.error('Erro ao buscar minhas tarefas:', error);
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
            logger.error('Erro ao buscar tarefas por status:', error);
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
            logger.error('Erro ao buscar tarefas atrasadas:', error);
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
