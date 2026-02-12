import { prisma } from '../lib/prisma';
import { Projeto, TarefaProjeto, ComentarioProjeto } from '../types_projetos';

export const projetosService = {
    // ==================== PROJETOS ====================

    async getProjetos(): Promise<Projeto[]> {
        return await prisma.projeto.findMany({
            include: {
                responsavel: {
                    select: { id: true, nome: true, email: true }
                }
            },
            orderBy: { created_at: 'desc' }
        }) as unknown as Projeto[];
    },

    async getProjetoById(id: string): Promise<Projeto | null> {
        return await prisma.projeto.findUnique({
            where: { id },
            include: {
                responsavel: {
                    select: { id: true, nome: true, email: true }
                }
            }
        }) as unknown as Projeto;
    },

    async createProjeto(projeto: Omit<Projeto, 'id' | 'created_at' | 'updated_at' | 'progresso'>): Promise<Projeto> {
        return await prisma.projeto.create({
            data: { ...projeto as any, progresso: 0 }
        }) as unknown as Projeto;
    },

    async updateProjeto(id: string, updates: Partial<Projeto>): Promise<Projeto> {
        return await prisma.projeto.update({
            where: { id },
            data: { ...updates as any, updated_at: new Date() }
        }) as unknown as Projeto;
    },

    async deleteProjeto(id: string): Promise<void> {
        await prisma.projeto.delete({
            where: { id }
        });
    },

    // ==================== TAREFAS ====================

    async getTarefasByProjeto(projetoId: string): Promise<TarefaProjeto[]> {
        return await prisma.tarefa_projeto.findMany({
            where: { projeto_id: projetoId },
            include: {
                responsavel: {
                    select: { id: true, nome: true, email: true }
                }
            },
            orderBy: { data_fim_prevista: 'asc' }
        }) as unknown as TarefaProjeto[];
    },

    async getTodasTarefas(): Promise<TarefaProjeto[]> {
        return await prisma.tarefa_projeto.findMany({
            include: {
                responsavel: {
                    select: { id: true, nome: true, email: true }
                },
                projeto: {
                    select: { id: true, nome: true }
                }
            },
            orderBy: { data_fim_prevista: 'asc' }
        }) as unknown as TarefaProjeto[];
    },

    async createTarefa(tarefa: Omit<TarefaProjeto, 'id' | 'created_at' | 'updated_at' | 'progresso'>): Promise<TarefaProjeto> {
        const data = await prisma.tarefa_projeto.create({
            data: { ...tarefa as any, progresso: 0 }
        }) as unknown as TarefaProjeto;

        // Se a tarefa tiver maquina_id, sugerir criar uma OS
        if (data && tarefa.maquina_id) {
            try {
                const { manutencaoService } = await import('./manutencaoService');
                const os = await manutencaoService.createOS({
                    descricao: `OS vinculada à tarefa de projeto: ${tarefa.titulo}`,
                    tipo: 'Preventiva',
                    tipo_os: 'Tarefa',
                    prioridade: 'Média',
                    status: 'Aberta',
                    tarefa_id: data.id,
                    maquina_id: tarefa.maquina_id,
                    data_abertura: new Date().toISOString(),
                    custo_total: 0,
                    pecas_utilizadas: []
                });

                await this.updateTarefa(data.id, { os_id: os.id });

            } catch (osError) {
                console.error('Erro ao criar OS para tarefa:', osError);
            }
        }

        return data;
    },

    async updateTarefa(id: string, updates: Partial<TarefaProjeto>): Promise<TarefaProjeto> {
        return await prisma.tarefa_projeto.update({
            where: { id },
            data: { ...updates as any, updated_at: new Date() }
        }) as unknown as TarefaProjeto;
    },

    async deleteTarefa(id: string): Promise<void> {
        await prisma.tarefa_projeto.delete({
            where: { id }
        });
    },

    // ==================== COMENTÁRIOS ====================

    async getComentarios(projetoId?: string, tarefaId?: string): Promise<ComentarioProjeto[]> {
        return await prisma.comentario_projeto.findMany({
            where: {
                projeto_id: projetoId,
                tarefa_id: tarefaId
            },
            include: {
                usuario: {
                    select: { id: true, nome: true, email: true }
                }
            },
            orderBy: { created_at: 'desc' }
        }) as unknown as ComentarioProjeto[];
    },

    async createComentario(comentario: Omit<ComentarioProjeto, 'id' | 'created_at'>): Promise<ComentarioProjeto> {
        return await prisma.comentario_projeto.create({
            data: comentario as any
        }) as unknown as ComentarioProjeto;
    },

    // ==================== ESTATÍSTICAS ====================

    async getEstatisticas() {
        const projetos = await prisma.projeto.findMany({
            select: { status: true, prioridade: true }
        });

        const tarefas = await prisma.tarefa_projeto.findMany({
            select: { status: true, prioridade: true }
        });

        return {
            projetos: {
                total: projetos.length,
                porStatus: this.contarPorCampo(projetos, 'status'),
                porPrioridade: this.contarPorCampo(projetos, 'prioridade')
            },
            tarefas: {
                total: tarefas.length,
                porStatus: this.contarPorCampo(tarefas, 'status'),
                porPrioridade: this.contarPorCampo(tarefas, 'prioridade')
            }
        };
    },

    contarPorCampo(items: any[], campo: string) {
        return items.reduce((acc, item) => {
            const valor = item[campo];
            acc[valor] = (acc[valor] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }
};
