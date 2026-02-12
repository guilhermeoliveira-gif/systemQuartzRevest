import { prisma } from '../lib/prisma';
import {
    Maquina,
    OrdemServico,
    StatusMaquina,
    StatusOS,
    MaquinaItem,
    Aprendizado,
    ManutencaoPlano,
    ManutencaoPlanoItem,
    MaquinaPlanoVinculo
} from '../types_manutencao';
import { logger } from '../utils/logger';

export const manutencaoService = {
    // ==================== MÁQUINAS ====================
    async getMaquinas(): Promise<Maquina[]> {
        const data = await prisma.manutencao_maquina.findMany({
            orderBy: { nome: 'asc' }
        });
        return data as unknown as Maquina[];
    },

    async createMaquina(maquina: Partial<Maquina>): Promise<Maquina> {
        const data = await prisma.manutencao_maquina.create({
            data: {
                ...(maquina as any),
                id: maquina.id || crypto.randomUUID()
            }
        });
        return data as unknown as Maquina;
    },

    async updateMaquina(id: string, updates: Partial<Maquina>): Promise<void> {
        await prisma.manutencao_maquina.update({
            where: { id },
            data: { ...updates as any, updated_at: new Date() }
        });
    },

    async deleteMaquina(id: string): Promise<void> {
        await prisma.manutencao_maquina.delete({
            where: { id }
        });
    },

    // ==================== ORDENS DE SERVIÇO ====================
    async getOrdensServico(): Promise<OrdemServico[]> {
        const data = await prisma.manutencao_os.findMany({
            include: {
                manutencao_maquina_maquina_id: {
                    select: { nome: true, modelo: true }
                }
            },
            orderBy: { data_abertura: 'desc' }
        });

        // Mapear para o formato esperado pelo frontend (maquina: { nome, modelo })
        return data.map((os: any) => ({
            ...os,
            maquina: os.manutencao_maquina_maquina_id
        })) as unknown as OrdemServico[];
    },

    async createOS(os: Partial<OrdemServico>): Promise<OrdemServico> {
        const { maquina_id, nc_id, tarefa_id, ...rest } = os;
        const data = await prisma.manutencao_os.create({
            data: {
                ...(rest as any),
                id: os.id || crypto.randomUUID(),
                manutencao_maquina_maquina_id: maquina_id ? { connect: { id: maquina_id } } : undefined,
                nao_conformidade_nc_id: nc_id ? { connect: { id: nc_id } } : undefined,
                tarefa_projeto_tarefa_id: tarefa_id ? { connect: { id: tarefa_id } } : undefined
            }
        });
        return data as unknown as OrdemServico;
    },

    async updateOS(id: string, updates: Partial<OrdemServico>): Promise<void> {
        await prisma.manutencao_os.update({
            where: { id },
            data: { ...updates as any, updated_at: new Date() }
        });

        if (updates.status === 'Concluída') {
            // Atualizar horas da máquina se houver
            if (updates.maquina_id && updates.horas_maquina_na_os) {
                await this.updateMaquina(updates.maquina_id, {
                    ultima_manutencao_horas: updates.horas_maquina_na_os,
                    status: 'Operacional'
                });
            }

            // Se for do tipo Tarefa e tiver tarefa_id, atualizar a tarefa
            if (updates.tarefa_id) {
                try {
                    const { projetosService } = await import('./projetosService');
                    await projetosService.updateTarefa(updates.tarefa_id, {
                        status: 'CONCLUIDA',
                        progresso: 100,
                        updated_at: new Date().toISOString()
                    });
                } catch (taskError) {
                    logger.error('Erro ao atualizar tarefa vinculada à OS:', taskError);
                }
            }
        }
    },

    // ==================== ITENS DE MÁQUINA ====================
    async getItensMaquina(maquinaId: string): Promise<MaquinaItem[]> {
        const data = await prisma.manutencao_maquina_item.findMany({
            where: { maquina_id: maquinaId },
            include: {
                mecanica_insumo_peca_estoque_id: {
                    select: {
                        nome: true,
                        unidade_medida: true,
                        quantidade_atual: true
                    }
                }
            }
        });

        // Mapear peca_estoque
        return data.map((item: any) => ({
            ...item,
            peca_estoque: item.mecanica_insumo_peca_estoque_id
        })) as unknown as MaquinaItem[];
    },

    async upsertItemMaquina(item: Partial<MaquinaItem>): Promise<void> {
        const { peca_estoque, id, ...dbItem } = item as any;

        if (id) {
            await prisma.manutencao_maquina_item.upsert({
                where: { id },
                update: dbItem,
                create: { ...dbItem, id }
            });
        } else {
            // Se não tiver ID, criar um novo
            await prisma.manutencao_maquina_item.create({
                data: {
                    ...(dbItem as any),
                    id: crypto.randomUUID(),
                    manutencao_maquina_maquina_id: dbItem.maquina_id ? { connect: { id: dbItem.maquina_id } } : undefined
                }
            });
        }
    },

    // ==================== APRENDIZADO / CONHECIMENTO ====================
    async getAprendizados(maquinaId?: string): Promise<Aprendizado[]> {
        const data = await prisma.manutencao_aprendizado.findMany({
            where: maquinaId ? { maquina_id: maquinaId } : {},
            orderBy: { created_at: 'desc' }
        });
        return data as unknown as Aprendizado[];
    },

    async createAprendizado(aprendizado: Partial<Aprendizado>): Promise<void> {
        const { maquina_id, os_id, created_by, ...rest } = aprendizado;
        await prisma.manutencao_aprendizado.create({
            data: {
                ...(rest as any),
                id: aprendizado.id || crypto.randomUUID(),
                manutencao_maquina_maquina_id: maquina_id ? { connect: { id: maquina_id } } : undefined,
                manutencao_os_os_id: os_id ? { connect: { id: os_id } } : undefined,
                usuarios_created_by: created_by ? { connect: { id: created_by } } : undefined
            }
        });
    },

    // ==================== PLANOS DE MANUTENÇÃO ====================
    async getPlanos(): Promise<(ManutencaoPlano & { itens: ManutencaoPlanoItem[] })[]> {
        const data = await prisma.manutencao_plano.findMany({
            include: {
                manutencao_plano_item_plano_id_list: true
            },
            orderBy: { nome: 'asc' }
        });

        return data.map((plano: any) => ({
            ...plano,
            itens: plano.manutencao_plano_item_plano_id_list
        })) as unknown as (ManutencaoPlano & { itens: ManutencaoPlanoItem[] })[];
    },

    async createPlano(plano: Partial<ManutencaoPlano>, itens: Partial<ManutencaoPlanoItem>[]): Promise<void> {
        await prisma.manutencao_plano.create({
            data: {
                ...(plano as any),
                manutencao_plano_item_plano_id_list: {
                    create: itens as any
                }
            }
        });
    },

    async vincularPlanoMaquina(maquinaId: string, planoId: string): Promise<void> {
        const existente = await prisma.manutencao_maquina_plano.findFirst({
            where: { maquina_id: maquinaId, plano_id: planoId }
        });

        if (existente) {
            await prisma.manutencao_maquina_plano.update({
                where: { id: existente.id },
                data: {
                    status_vencimento: 'OK'
                    // removed updated_at as it doesn't exist in schema
                }
            });
        } else {
            await prisma.manutencao_maquina_plano.create({
                data: {
                    id: crypto.randomUUID(),
                    manutencao_maquina_maquina_id: { connect: { id: maquinaId } },
                    manutencao_plano_plano_id: { connect: { id: planoId } },
                    status_vencimento: 'OK'
                }
            });
        }
    },

    async getPlanosByMaquina(maquinaId: string): Promise<MaquinaPlanoVinculo[]> {
        const data = await prisma.manutencao_maquina_plano.findMany({
            where: { maquina_id: maquinaId },
            include: {
                manutencao_plano_plano_id: true
            }
        });

        return data.map((vinculo: any) => ({
            ...vinculo,
            plano: vinculo.manutencao_plano_plano_id
        })) as unknown as MaquinaPlanoVinculo[];
    }
};
