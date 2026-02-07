import { supabase } from './supabaseClient';
import { Projeto, TarefaProjeto, ComentarioProjeto } from '../types_projetos';

export const projetosService = {
    // ==================== PROJETOS ====================

    async getProjetos(): Promise<Projeto[]> {
        const { data, error } = await supabase
            .from('projeto')
            .select(`
                *,
                responsavel:usuarios(id, nome, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar projetos:', error);
            throw error;
        }

        return data as any || [];
    },

    async getProjetoById(id: string): Promise<Projeto | null> {
        const { data, error } = await supabase
            .from('projeto')
            .select(`
                *,
                responsavel:usuarios(id, nome, email)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro ao buscar projeto:', error);
            return null;
        }

        return data as any;
    },

    async createProjeto(projeto: Omit<Projeto, 'id' | 'created_at' | 'updated_at' | 'progresso'>): Promise<Projeto> {
        const { data, error } = await supabase
            .from('projeto')
            .insert([{ ...projeto, progresso: 0 }])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar projeto:', error);
            throw error;
        }

        return data;
    },

    async updateProjeto(id: string, updates: Partial<Projeto>): Promise<Projeto> {
        const { data, error } = await supabase
            .from('projeto')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar projeto:', error);
            throw error;
        }

        return data;
    },

    async deleteProjeto(id: string): Promise<void> {
        const { error } = await supabase
            .from('projeto')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao deletar projeto:', error);
            throw error;
        }
    },

    // ==================== TAREFAS ====================

    async getTarefasByProjeto(projetoId: string): Promise<TarefaProjeto[]> {
        const { data, error } = await supabase
            .from('tarefa_projeto')
            .select(`
                *,
                responsavel:usuarios(id, nome, email)
            `)
            .eq('projeto_id', projetoId)
            .order('data_fim_prevista', { ascending: true });

        if (error) {
            console.error('Erro ao buscar tarefas:', error);
            throw error;
        }

        return data as any || [];
    },

    async getTodasTarefas(): Promise<TarefaProjeto[]> {
        const { data, error } = await supabase
            .from('tarefa_projeto')
            .select(`
                *,
                responsavel:usuarios(id, nome, email),
                projeto:projeto(id, nome)
            `)
            .order('data_fim_prevista', { ascending: true });

        if (error) {
            console.error('Erro ao buscar tarefas:', error);
            throw error;
        }

        return data as any || [];
    },

    async createTarefa(tarefa: Omit<TarefaProjeto, 'id' | 'created_at' | 'updated_at' | 'progresso'>): Promise<TarefaProjeto> {
        const { data, error } = await supabase
            .from('tarefa_projeto')
            .insert([{ ...tarefa, progresso: 0 }])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar tarefa:', error);
            throw error;
        }

        return data;
    },

    async updateTarefa(id: string, updates: Partial<TarefaProjeto>): Promise<TarefaProjeto> {
        const { data, error } = await supabase
            .from('tarefa_projeto')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar tarefa:', error);
            throw error;
        }

        return data;
    },

    async deleteTarefa(id: string): Promise<void> {
        const { error } = await supabase
            .from('tarefa_projeto')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao deletar tarefa:', error);
            throw error;
        }
    },

    // ==================== COMENTÁRIOS ====================

    async getComentarios(projetoId?: string, tarefaId?: string): Promise<ComentarioProjeto[]> {
        let query = supabase
            .from('comentario_projeto')
            .select(`
                *,
                usuario:usuarios(id, nome, email)
            `)
            .order('created_at', { ascending: false });

        if (projetoId) {
            query = query.eq('projeto_id', projetoId);
        }
        if (tarefaId) {
            query = query.eq('tarefa_id', tarefaId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar comentários:', error);
            throw error;
        }

        return data as any || [];
    },

    async createComentario(comentario: Omit<ComentarioProjeto, 'id' | 'created_at'>): Promise<ComentarioProjeto> {
        const { data, error } = await supabase
            .from('comentario_projeto')
            .insert([comentario])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar comentário:', error);
            throw error;
        }

        return data;
    },

    // ==================== ESTATÍSTICAS ====================

    async getEstatisticas() {
        const { data: projetos } = await supabase
            .from('projeto')
            .select('status, prioridade');

        const { data: tarefas } = await supabase
            .from('tarefa_projeto')
            .select('status, prioridade');

        return {
            projetos: {
                total: projetos?.length || 0,
                porStatus: this.contarPorCampo(projetos || [], 'status'),
                porPrioridade: this.contarPorCampo(projetos || [], 'prioridade')
            },
            tarefas: {
                total: tarefas?.length || 0,
                porStatus: this.contarPorCampo(tarefas || [], 'status'),
                porPrioridade: this.contarPorCampo(tarefas || [], 'prioridade')
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
