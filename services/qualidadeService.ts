import { prisma } from '../lib/prisma';
import { NaoConformidade } from '../types_nc';
import { PlanoAcao, Tarefa } from '../types_plano_acao';
import { logger } from '../utils/logger';

// ==================== NÃO CONFORMIDADES ====================

export const qualidadeService = {
    // Listar todas as não conformidades
    async getNaoConformidades(): Promise<NaoConformidade[]> {
        const data = await prisma.nao_conformidade.findMany({
            orderBy: { created_at: 'desc' }
        });
        return data as unknown as NaoConformidade[];
    },

    // Buscar uma não conformidade específica
    async getNaoConformidadeById(id: string): Promise<NaoConformidade | null> {
        const data = await prisma.nao_conformidade.findUnique({
            where: { id }
        });
        return data as unknown as NaoConformidade;
    },

    // Criar nova não conformidade
    async createNaoConformidade(nc: Omit<NaoConformidade, 'id' | 'created_at'>): Promise<NaoConformidade> {
        const data = await prisma.nao_conformidade.create({
            data: nc as any
        });

        // Se for um problema, criar OS automaticamente
        if (data) {
            try {
                const { manutencaoService } = await import('./manutencaoService');

                await manutencaoService.createOS({
                    descricao: `OS gerada automaticamente a partir do problema: ${data.titulo}`,
                    tipo: 'Corretiva',
                    tipo_os: 'Problema',
                    prioridade: 'Urgente',
                    status: 'Aberta',
                    nc_id: data.id,
                    data_abertura: new Date().toISOString(),
                    custo_total: 0,
                    pecas_utilizadas: []
                });
            } catch (osError) {
                logger.error('Erro ao criar OS automática para NC:', osError);
            }
        }

        return data as unknown as NaoConformidade;
    },

    // Atualizar não conformidade
    async updateNaoConformidade(id: string, updates: Partial<NaoConformidade>): Promise<NaoConformidade> {
        const data = await prisma.nao_conformidade.update({
            where: { id },
            data: { ...updates as any, updated_at: new Date() }
        });
        return data as unknown as NaoConformidade;
    },

    // Salvar análise de causa (5 Porquês)
    async saveAnaliseCausa(ncId: string, analise: {
        pq1: string;
        pq2?: string;
        pq3?: string;
        pq4?: string;
        pq5?: string;
        causa_raiz: string;
    }) {
        const data = await prisma.analise_causa.create({
            data: {
                nao_conformidade_id: ncId,
                ...analise
            }
        });

        // Atualizar status da NC para ACAO_DEFINIDA
        await this.updateNaoConformidade(ncId, { status: 'ACAO_DEFINIDA' });

        return data;
    },

    // Buscar análise de causa de uma NC
    async getAnaliseCausa(ncId: string) {
        const data = await prisma.analise_causa.findFirst({
            where: { nao_conformidade_id: ncId }
        });
        return data;
    },

    // Deletar não conformidade
    async deleteNaoConformidade(id: string): Promise<void> {
        await prisma.nao_conformidade.delete({
            where: { id }
        });
    },

    // ==================== PLANOS DE AÇÃO ====================

    // Deletar plano de ação
    async deletePlanoAcao(id: string): Promise<void> {
        await prisma.plano_acao.delete({
            where: { id }
        });
    },

    // Listar todos os planos de ação
    async getPlanosAcao(): Promise<PlanoAcao[]> {
        const data = await prisma.plano_acao.findMany({
            orderBy: { created_at: 'desc' }
        });
        return data as unknown as PlanoAcao[];
    },

    // Buscar planos de ação de uma NC específica
    async getPlanosByNC(ncId: string): Promise<PlanoAcao[]> {
        const data = await prisma.plano_acao.findMany({
            where: { nao_conformidade_id: ncId }
        });
        return data as unknown as PlanoAcao[];
    },

    // Criar novo plano de ação
    async createPlanoAcao(plano: Omit<PlanoAcao, 'id' | 'created_at' | 'updated_at'>): Promise<PlanoAcao> {
        const data = await prisma.plano_acao.create({
            data: plano as any
        });
        return data as unknown as PlanoAcao;
    },

    // Atualizar plano de ação
    async updatePlanoAcao(id: string, updates: Partial<PlanoAcao>): Promise<PlanoAcao> {
        const data = await prisma.plano_acao.update({
            where: { id },
            data: { ...updates as any, updated_at: new Date() }
        });
        return data as unknown as PlanoAcao;
    },

    // ==================== TAREFAS ====================

    // Listar tarefas de um plano de ação
    async getTarefasByPlano(planoId: string): Promise<Tarefa[]> {
        const data = await prisma.tarefa.findMany({
            where: { plano_acao_id: planoId },
            orderBy: { prazo: 'asc' }
        });
        return data as unknown as Tarefa[];
    },

    // Listar todas as tarefas (para visualização geral ou por responsável)
    async getTodasTarefas(): Promise<Tarefa[]> {
        const data = await prisma.tarefa.findMany({
            include: {
                plano_acao_plano_acao_id: {
                    select: { titulo: true }
                }
            },
            orderBy: { prazo: 'asc' }
        });

        // Mapear para adicionar título do plano
        return data.map((t: any) => ({
            ...t,
            plano_acao: t.plano_acao_plano_acao_id
        })) as unknown as Tarefa[];
    },

    // Criar nova tarefa
    async createTarefa(tarefa: Omit<Tarefa, 'id' | 'created_at' | 'updated_at'>): Promise<Tarefa> {
        const data = await prisma.tarefa.create({
            data: tarefa as any
        });
        return data as unknown as Tarefa;
    },

    // Atualizar tarefa
    async updateTarefa(id: string, updates: Partial<Tarefa>): Promise<Tarefa> {
        const data = await prisma.tarefa.update({
            where: { id },
            data: { ...updates as any, updated_at: new Date() }
        });
        return data as unknown as Tarefa;
    },

    // Deletar tarefa
    async deleteTarefa(id: string): Promise<void> {
        await prisma.tarefa.delete({
            where: { id }
        });
    }
};
