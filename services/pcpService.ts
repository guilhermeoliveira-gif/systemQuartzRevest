
import { supabase } from './supabaseClient';
import {
    PlanoProducao,
    ItemPlanoProducao,
    RegistroProducao,
    StatusPlanoProducao,
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

        if (error) throw error;
        return data || [];
    },

    async createPlano(plano: Partial<PlanoProducao>): Promise<PlanoProducao> {
        const { data, error } = await supabase
            .from('plano_producao')
            .insert([plano])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ==================== ITENS DO PLANO ====================
    async getItensPlano(planoId: string): Promise<ItemPlanoProducao[]> {
        const { data, error } = await supabase
            .from('item_plano_producao')
            .select('*')
            .eq('id_plano_producao', planoId)
            .order('ordem', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async createItemPlano(item: Partial<ItemPlanoProducao>): Promise<ItemPlanoProducao> {
        const { data, error } = await supabase
            .from('item_plano_producao')
            .insert([item])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateItemStatus(id: string, status: StatusItemProducao): Promise<void> {
        const { error } = await supabase
            .from('item_plano_producao')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    async deleteItemPlano(id: string): Promise<void> {
        const { error } = await supabase
            .from('item_plano_producao')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ==================== REGISTROS DE PRODUÇÃO ====================
    async iniciarProducao(registro: Partial<RegistroProducao>): Promise<RegistroProducao> {
        const { data, error } = await supabase
            .from('registro_producao')
            .insert([{ ...registro, data_hora_inicio: new Date().toISOString() }])
            .select()
            .single();

        if (error) throw error;

        // Atualiza status do item para 'Produzindo'
        await this.updateItemStatus(registro.id_item_plano_producao!, 'Produzindo');

        return data;
    },

    async finalizarProducao(id: string, dadosFim: Partial<RegistroProducao>): Promise<void> {
        const { data: registroAtivo, error: errorFetch } = await supabase
            .from('registro_producao')
            .select('*')
            .eq('id', id)
            .single();

        if (errorFetch) throw errorFetch;

        const { error } = await supabase
            .from('registro_producao')
            .update({
                ...dadosFim,
                data_hora_fim: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

        // Atualiza status do item para 'Finalizado'
        await this.updateItemStatus(registroAtivo.id_item_plano_producao, 'Finalizado');
    },

    async getHistorico(): Promise<any[]> {
        const { data, error } = await supabase
            .from('registro_producao')
            .select(`
                *,
                item:item_plano_producao(nome_produto_acabado)
            `)
            .order('data_hora_inicio', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
