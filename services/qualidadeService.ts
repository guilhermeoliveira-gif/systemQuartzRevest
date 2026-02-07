import { supabase } from './supabaseClient';
import { NaoConformidade } from '../types_nc';
import { PlanoAcao, Tarefa } from '../types_plano_acao';

// ==================== NÃO CONFORMIDADES ====================

export const qualidadeService = {
    // Listar todas as não conformidades
    async getNaoConformidades(): Promise<NaoConformidade[]> {
        const { data, error } = await supabase
            .from('nao_conformidade')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar não conformidades:', error);
            throw error;
        }

        return data || [];
    },

    // Buscar uma não conformidade específica
    async getNaoConformidadeById(id: string): Promise<NaoConformidade | null> {
        const { data, error } = await supabase
            .from('nao_conformidade')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro ao buscar não conformidade:', error);
            return null;
        }

        return data;
    },

    // Criar nova não conformidade
    async createNaoConformidade(nc: Omit<NaoConformidade, 'id' | 'created_at'>): Promise<NaoConformidade> {
        const { data, error } = await supabase
            .from('nao_conformidade')
            .insert([nc])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar não conformidade:', error);
            throw error;
        }

        return data;
    },

    // Atualizar não conformidade
    async updateNaoConformidade(id: string, updates: Partial<NaoConformidade>): Promise<NaoConformidade> {
        const { data, error } = await supabase
            .from('nao_conformidade')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar não conformidade:', error);
            throw error;
        }

        return data;
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
        const { data, error } = await supabase
            .from('analise_causa')
            .insert([{
                nao_conformidade_id: ncId,
                ...analise
            }])
            .select()
            .single();

        if (error) {
            console.error('Erro ao salvar análise de causa:', error);
            throw error;
        }

        // Atualizar status da NC para ACAO_DEFINIDA
        await this.updateNaoConformidade(ncId, { status: 'ACAO_DEFINIDA' });

        return data;
    },

    // Buscar análise de causa de uma NC
    async getAnaliseCausa(ncId: string) {
        const { data, error } = await supabase
            .from('analise_causa')
            .select('*')
            .eq('nao_conformidade_id', ncId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('Erro ao buscar análise de causa:', error);
        }

        return data;
    },

    // ==================== PLANOS DE AÇÃO ====================

    // Listar todos os planos de ação
    async getPlanosAcao(): Promise<PlanoAcao[]> {
        const { data, error } = await supabase
            .from('plano_acao')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar planos de ação:', error);
            throw error;
        }

        return data || [];
    },

    // Buscar planos de ação de uma NC específica
    async getPlanosByNC(ncId: string): Promise<PlanoAcao[]> {
        const { data, error } = await supabase
            .from('plano_acao')
            .select('*')
            .eq('nao_conformidade_id', ncId);

        if (error) {
            console.error('Erro ao buscar planos de ação:', error);
            throw error;
        }

        return data || [];
    },

    // Criar novo plano de ação
    async createPlanoAcao(plano: Omit<PlanoAcao, 'id' | 'created_at' | 'updated_at'>): Promise<PlanoAcao> {
        const { data, error } = await supabase
            .from('plano_acao')
            .insert([plano])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar plano de ação:', error);
            throw error;
        }

        return data;
    },

    // Atualizar plano de ação
    async updatePlanoAcao(id: string, updates: Partial<PlanoAcao>): Promise<PlanoAcao> {
        const { data, error } = await supabase
            .from('plano_acao')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar plano de ação:', error);
            throw error;
        }

        return data;
    },

    // ==================== TAREFAS ====================

    // Listar tarefas de um plano de ação
    async getTarefasByPlano(planoId: string): Promise<Tarefa[]> {
        const { data, error } = await supabase
            .from('tarefa')
            .select('*')
            .eq('plano_acao_id', planoId)
            .order('prazo', { ascending: true });

        if (error) {
            console.error('Erro ao buscar tarefas:', error);
            throw error;
        }

        return data || [];
    },

    // Listar todas as tarefas (para visualização geral ou por responsável)
    async getTodasTarefas(): Promise<Tarefa[]> {
        const { data, error } = await supabase
            .from('tarefa')
            .select(`
                *,
                plano_acao:plano_acao(titulo)
            `)
            .order('prazo', { ascending: true });

        if (error) {
            console.error('Erro ao buscar todas as tarefas:', error);
            throw error;
        }

        // Mapear para adicionar título do plano se necessário, ou retornar como está
        // O tipo Tarefa precisaria ser estendido se quisermos incluir o título do plano no objeto, 
        // mas por enquanto retornamos os dados "como vêm" do supabase com o join, 
        // precisaremos ajustar o componente para ler isso.
        return data as any || [];
    },

    // Criar nova tarefa
    async createTarefa(tarefa: Omit<Tarefa, 'id' | 'created_at' | 'updated_at'>): Promise<Tarefa> {
        const { data, error } = await supabase
            .from('tarefa')
            .insert([tarefa])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar tarefa:', error);
            throw error;
        }

        return data;
    },

    // Atualizar tarefa
    async updateTarefa(id: string, updates: Partial<Tarefa>): Promise<Tarefa> {
        const { data, error } = await supabase
            .from('tarefa')
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

    // Deletar tarefa
    async deleteTarefa(id: string): Promise<void> {
        const { error } = await supabase
            .from('tarefa')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao deletar tarefa:', error);
            throw error;
        }
    }
};
