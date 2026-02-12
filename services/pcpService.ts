
import { supabase } from './supabaseClient';
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
        const { data, error } = await supabase
            .from('plano_producao')
            .select(`
                *,
                itens:item_plano_producao(*)
            `)
            .order('data_planejamento', { ascending: false });

        if (error) {
            logger.error('Erro ao buscar planos de produção', error);
            throw error;
        }
        return data || [];
    },

    async createPlano(plano: Partial<PlanoProducao>): Promise<PlanoProducao> {
        const { data, error } = await supabase
            .from('plano_producao')
            .insert([plano])
            .select()
            .single();

        if (error) {
            logger.error('Erro ao criar plano de produção', error);
            throw error;
        }
        return data;
    },

    // ==================== ITENS DO PLANO ====================
    async getItensPlano(planoId: string): Promise<ItemPlanoProducao[]> {
        const { data, error } = await supabase
            .from('item_plano_producao')
            .select('*')
            .eq('id_plano_producao', planoId)
            .order('ordem', { ascending: true });

        if (error) {
            logger.error(`Erro ao buscar itens do plano ${planoId}`, error);
            throw error;
        }
        return data || [];
    },

    async createItemPlano(item: Partial<ItemPlanoProducao>): Promise<ItemPlanoProducao> {
        const { data, error } = await supabase
            .from('item_plano_producao')
            .insert([item])
            .select()
            .single();

        if (error) {
            logger.error('Erro ao criar item do plano', error);
            throw error;
        }
        return data;
    },

    async updateItemStatus(id: string, status: StatusItemProducao): Promise<void> {
        const { error } = await supabase
            .from('item_plano_producao')
            .update({ status: status as any, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            logger.error(`Erro ao atualizar status do item ${id} para ${status}`, error);
            throw error;
        }
    },

    async deleteItemPlano(id: string): Promise<void> {
        const { error } = await supabase
            .from('item_plano_producao')
            .delete()
            .eq('id', id);

        if (error) {
            logger.error(`Erro ao excluir item do plano ${id}`, error);
            throw error;
        }
    },

    // ==================== REGISTROS DE PRODUÇÃO ====================
    async iniciarProducao(registro: Partial<RegistroProducao>): Promise<RegistroProducao> {
        const { data, error } = await supabase
            .from('registro_producao')
            .insert([{ ...registro, data_hora_inicio: new Date().toISOString() }])
            .select()
            .single();

        if (error) {
            logger.error('Erro ao iniciar registro de produção', error);
            throw error;
        }

        // Atualiza status do item para 'Produzindo'
        // Nota: Idealmente seria transactional, mas supabase-js não suporta transaction cross-table simples assim
        try {
            if (registro.id_item_plano_producao) {
                await this.updateItemStatus(registro.id_item_plano_producao, 'Produzindo');
            }
        } catch (updateError) {
            logger.error('Produção iniciada, mas falha ao atualizar status do item', updateError);
            // Não throw aqui para não bloquear o operador, mas é um estado inconsistente
        }

        return data;
    },

    async finalizarProducao(id: string, dadosFim: Partial<RegistroProducao>): Promise<void> {
        // 1. Busca registro atual para saber qual item atualizar
        const { data: registroAtivo, error: errorFetch } = await supabase
            .from('registro_producao')
            .select('*')
            .eq('id', id)
            .single();

        if (errorFetch) {
            logger.error(`Erro ao buscar registro de produção ${id} para finalizar`, errorFetch);
            throw errorFetch;
        }

        // 2. Atualiza registro com dados finais
        const { error } = await supabase
            .from('registro_producao')
            .update({
                ...dadosFim,
                data_hora_fim: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            logger.error(`Erro ao finalizar registro de produção ${id}`, error);
            throw error;
        }

        // 3. Atualiza status do item para 'Finalizado'
        if (registroAtivo && registroAtivo.id_item_plano_producao) {
            try {
                await this.updateItemStatus(registroAtivo.id_item_plano_producao, 'Finalizado');
            } catch (updateError) {
                logger.error('Produção finalizada, mas falha ao atualizar status do item', updateError);
            }
        }
    },

    async getHistorico(): Promise<RegistroProducao[]> {
        const { data, error } = await supabase
            .from('registro_producao')
            .select(`
                *,
                item:item_plano_producao(nome_produto_acabado)
            `)
            .order('data_hora_inicio', { ascending: false });

        if (error) {
            logger.error('Erro ao buscar histórico de produção', error);
            throw error;
        }
        return data || [];
    }
};
