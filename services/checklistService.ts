import { prisma } from '../lib/prisma';
import {
    ChecklistModelo,
    ChecklistItemModelo,
    ChecklistAgendamento,
    ChecklistExecucao,
    ChecklistResposta
} from '../types_checklist';
import { qualidadeService } from './qualidadeService';
import { logger } from '../utils/logger';

export const checklistService = {
    // ==================== MODELOS ====================
    async getModelos(): Promise<ChecklistModelo[]> {
        const data = await prisma.checklist_modelo.findMany({
            include: {
                checklist_item_modelo_modelo_id_list: true
            },
            orderBy: { nome: 'asc' }
        });

        return data.map((m: any) => ({
            ...m,
            itens: m.checklist_item_modelo_modelo_id_list
        })) as unknown as ChecklistModelo[];
    },

    async createModelo(modelo: Omit<ChecklistModelo, 'id' | 'created_at' | 'updated_at'>): Promise<ChecklistModelo> {
        const data = await prisma.checklist_modelo.create({
            data: {
                ...(modelo as any),
                id: crypto.randomUUID()
            }
        });
        return data as unknown as ChecklistModelo;
    },

    async createItemModelo(item: Omit<ChecklistItemModelo, 'id' | 'created_at'>): Promise<ChecklistItemModelo> {
        const { modelo_id, ...rest } = item as any;
        const data = await prisma.checklist_item_modelo.create({
            data: {
                ...(rest as any),
                id: crypto.randomUUID(),
                checklist_modelo_modelo_id: modelo_id ? { connect: { id: modelo_id } } : undefined
            }
        });
        return data as unknown as ChecklistItemModelo;
    },

    // ==================== AGENDAMENTOS ====================
    async getAgendamentos(filtro?: { status?: string, responsavel_id?: string }): Promise<ChecklistAgendamento[]> {
        const data = await prisma.checklist_agendamento.findMany({
            where: {
                status: filtro?.status,
                responsavel_id: filtro?.responsavel_id
            },
            include: {
                checklist_modelo_modelo_id: {
                    select: { nome: true, area: true }
                }
                // Nota: Relacionamento com usuarios na responsavel_id não parece estar no schema.prisma de forma direta para agendamento.
                // Vou manter o mapeamento manual se necessário ou ajustar via include se o schema permitir.
            },
            orderBy: { data_agendada: 'asc' }
        });

        // Mapear relacionamentos
        return data.map((a: any) => ({
            ...a,
            modelo: a.checklist_modelo_modelo_id
        })) as unknown as ChecklistAgendamento[];
    },

    async createAgendamento(agendamento: Omit<ChecklistAgendamento, 'id' | 'created_at' | 'updated_at'>): Promise<ChecklistAgendamento> {
        const { modelo_id, responsavel_id, ...rest } = agendamento as any;
        const data = await prisma.checklist_agendamento.create({
            data: {
                ...(rest as any),
                id: crypto.randomUUID(),
                checklist_modelo_modelo_id: modelo_id ? { connect: { id: modelo_id } } : undefined
                // responsavel_id remains as scalar if no relation is defined in schema (as noted at line 53)
            }
        });
        return data as unknown as ChecklistAgendamento;
    },

    // ==================== EXECUÇÃO ====================
    async iniciarExecucao(agendamentoId: string, executorId: string): Promise<ChecklistExecucao> {
        // Usar transação para garantir atomicidade
        const [_, execucao] = await prisma.$transaction([
            prisma.checklist_agendamento.update({
                where: { id: agendamentoId },
                data: { status: 'EM_ANDAMENTO', updated_at: new Date() }
            }),
            prisma.checklist_execucao.create({
                data: {
                    id: crypto.randomUUID(),
                    checklist_agendamento_agendamento_id: { connect: { id: agendamentoId } },
                    executor_id: executorId,
                    status: 'EM_ANDAMENTO',
                    data_inicio: new Date()
                }
            })
        ]);

        return execucao as unknown as ChecklistExecucao;
    },

    async salvarResposta(resposta: Omit<ChecklistResposta, 'id' | 'created_at'>, modeloItem: ChecklistItemModelo, entidadeContexto: string): Promise<ChecklistResposta> {
        let ncId = null;

        // Automação: Se NÃO CONFORME, gerar NC
        if (resposta.conforme === false) {
            try {
                const nc = await qualidadeService.createNaoConformidade({
                    titulo: `Falha Checklist: ${modeloItem.texto}`,
                    descricao: `Item não conforme identificado durante checklist. Observação: ${resposta.observacao || 'Sem obs'}. Item: ${modeloItem.texto}. Contexto: ${entidadeContexto}`,
                    tipo: 'PROCESSO',
                    origem: 'CHECKLIST',
                    data_ocorrencia: new Date().toISOString(),
                    status: 'EM_ANALISE',
                    severidade: 'ALTA', // Default alta para disparar OS
                    responsavel_id: 'SYSTEM_CHECKLIST' // Alterado de CURRENT_USER para valor constante compatível
                });
                ncId = nc.id;
            } catch (e) {
                logger.error('Erro ao gerar NC automática:', e);
            }
        }

        const { execucao_id, item_modelo_id, ...rest } = resposta as any;
        const data = await prisma.checklist_resposta.create({
            data: {
                ...(rest as any),
                id: crypto.randomUUID(),
                checklist_execucao_execucao_id: execucao_id ? { connect: { id: execucao_id } } : undefined,
                checklist_item_modelo_item_modelo_id: item_modelo_id ? { connect: { id: item_modelo_id } } : undefined
            }
        });

        return data as unknown as ChecklistResposta;
    },

    async finalizarExecucao(execucaoId: string, agendamentoId: string): Promise<void> {
        await prisma.$transaction([
            prisma.checklist_execucao.update({
                where: { id: execucaoId },
                data: {
                    status: 'FINALIZADO',
                    data_fim: new Date()
                }
            }),
            prisma.checklist_agendamento.update({
                where: { id: agendamentoId },
                data: { status: 'CONCLUIDO', updated_at: new Date() }
            })
        ]);
    }
};
