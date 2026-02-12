
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import {
    PlanoProducao,
    ItemPlanoProducao,
    RegistroProducao,
    StatusItemProducao
} from '../types_pcp';

export const pcpService = {
    // ==================== PLANOS ====================
    async getPlanos(): Promise<PlanoProducao[]> {
        return await prisma.plano_producao.findMany({
            include: {
                item_plano_producao_id_plano_producao_list: true
            },
            orderBy: { data_planejamento: 'desc' }
        }) as unknown as PlanoProducao[];
    },

    async createPlano(plano: Partial<PlanoProducao>): Promise<PlanoProducao> {
        return await prisma.plano_producao.create({
            data: plano as any
        }) as unknown as PlanoProducao;
    },

    // ==================== ITENS DO PLANO ====================
    async getItensPlano(planoId: string): Promise<ItemPlanoProducao[]> {
        return await prisma.item_plano_producao.findMany({
            where: { id_plano_producao: planoId },
            orderBy: { ordem: 'asc' }
        }) as unknown as ItemPlanoProducao[];
    },

    async createItemPlano(item: Partial<ItemPlanoProducao>): Promise<ItemPlanoProducao> {
        return await prisma.item_plano_producao.create({
            data: item as any
        }) as unknown as ItemPlanoProducao;
    },

    async updateItemStatus(id: string, status: StatusItemProducao): Promise<void> {
        await prisma.item_plano_producao.update({
            where: { id },
            data: { status: status as any, updated_at: new Date() }
        });
    },

    async deleteItemPlano(id: string): Promise<void> {
        await prisma.item_plano_producao.delete({
            where: { id }
        });
    },

    // ==================== REGISTROS DE PRODUÇÃO ====================
    async iniciarProducao(registro: Partial<RegistroProducao>): Promise<RegistroProducao> {
        const data = await prisma.registro_producao.create({
            data: { ...registro as any, data_hora_inicio: new Date() }
        });

        // Atualiza status do item para 'Produzindo'
        try {
            if (registro.id_item_plano_producao) {
                await this.updateItemStatus(registro.id_item_plano_producao, 'Produzindo');
            }
        } catch (updateError) {
            logger.error('Produção iniciada, mas falha ao atualizar status do item', updateError);
        }

        return data as unknown as RegistroProducao;
    },

    async finalizarProducao(id: string, dadosFim: Partial<RegistroProducao>): Promise<void> {
        // 1. Busca registro atual para saber qual item atualizar
        const registroAtivo = await prisma.registro_producao.findUnique({
            where: { id }
        });

        if (!registroAtivo) {
            const error = new Error('Registro de produção não encontrado');
            logger.error(`Erro ao buscar registro de produção ${id} para finalizar`, error);
            throw error;
        }

        // 2. Atualiza registro com dados finais
        await prisma.registro_producao.update({
            where: { id },
            data: {
                ...dadosFim as any,
                data_hora_fim: new Date()
            }
        });

        // 3. Atualiza status do item para 'Finalizado'
        if (registroAtivo.id_item_plano_producao) {
            try {
                await this.updateItemStatus(registroAtivo.id_item_plano_producao, 'Finalizado');
            } catch (updateError) {
                logger.error('Produção finalizada, mas falha ao atualizar status do item', updateError);
            }
        }
    },

    async getHistorico(): Promise<RegistroProducao[]> {
        const data = await prisma.registro_producao.findMany({
            include: {
                item_plano_producao_id_item_plano_producao: {
                    select: { nome_produto_acabado: true }
                }
            },
            orderBy: { data_hora_inicio: 'desc' }
        });
        return data as unknown as RegistroProducao[];
    }
};
