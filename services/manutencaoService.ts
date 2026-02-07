
import { supabase } from './supabaseClient';
import {
    Maquina,
    OrdemServico,
    StatusMaquina,
    StatusOS,
    MaquinaItem,
    Aprendizado
} from '../types_manutencao';

export const manutencaoService = {
    // ==================== MÁQUINAS ====================
    async getMaquinas(): Promise<Maquina[]> {
        const { data, error } = await supabase
            .from('manutencao_maquina')
            .select('*')
            .order('nome', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async createMaquina(maquina: Partial<Maquina>): Promise<Maquina> {
        const { data, error } = await supabase
            .from('manutencao_maquina')
            .insert([maquina])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateMaquina(id: string, updates: Partial<Maquina>): Promise<void> {
        const { error } = await supabase
            .from('manutencao_maquina')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    async deleteMaquina(id: string): Promise<void> {
        const { error } = await supabase
            .from('manutencao_maquina')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ==================== ORDENS DE SERVIÇO ====================
    async getOrdensServico(): Promise<OrdemServico[]> {
        const { data, error } = await supabase
            .from('manutencao_os')
            .select(`
                *,
                maquina:manutencao_maquina(nome, modelo)
            `)
            .order('data_abertura', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async createOS(os: Partial<OrdemServico>): Promise<OrdemServico> {
        const { data, error } = await supabase
            .from('manutencao_os')
            .insert([os])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateOS(id: string, updates: Partial<OrdemServico>): Promise<void> {
        const { error } = await supabase
            .from('manutencao_os')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        // Se a OS for concluída, atualizar as horas da última manutenção na máquina
        if (updates.status === 'Concluída' && updates.maquina_id && updates.horas_maquina_na_os) {
            await this.updateMaquina(updates.maquina_id, {
                ultima_manutencao_horas: updates.horas_maquina_na_os,
                status: 'Operacional'
            });
        }
    },

    // ==================== ITENS DE MÁQUINA ====================
    async getItensMaquina(maquinaId: string): Promise<MaquinaItem[]> {
        const { data, error } = await supabase
            .from('manutencao_maquina_item')
            .select('*')
            .eq('maquina_id', maquinaId);
        if (error) throw error;
        return data || [];
    },

    async upsertItemMaquina(item: Partial<MaquinaItem>): Promise<void> {
        const { error } = await supabase
            .from('manutencao_maquina_item')
            .upsert(item);
        if (error) throw error;
    },

    // ==================== APRENDIZADO / CONHECIMENTO ====================
    async getAprendizados(maquinaId?: string): Promise<Aprendizado[]> {
        let query = supabase.from('manutencao_aprendizado').select('*');
        if (maquinaId) query = query.eq('maquina_id', maquinaId);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async createAprendizado(aprendizado: Partial<Aprendizado>): Promise<void> {
        const { error } = await supabase
            .from('manutencao_aprendizado')
            .insert([aprendizado]);
        if (error) throw error;
    }
};
