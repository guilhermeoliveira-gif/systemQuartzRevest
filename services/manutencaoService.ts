
import { supabase } from './supabaseClient';
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
                    // @ts-ignore
                    const { projetosService } = await import('./projetosService');
                    await projetosService.updateTarefa(updates.tarefa_id, {
                        status: 'CONCLUIDA',
                        progresso: 100,
                        updated_at: new Date().toISOString()
                    });
                } catch (taskError) {
                    console.error('Erro ao atualizar tarefa vinculada à OS:', taskError);
                }
            }
        }
    },

    async iniciarOS(id: string, tecnico?: string): Promise<void> {
        const updates: Partial<OrdemServico> = {
            status: 'Em Execução',
            data_inicio: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        if (tecnico) updates.tecnico_responsavel = tecnico;

        const { error } = await supabase
            .from('manutencao_os')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async finalizarOS(id: string, dados: { tipo_correcao: 'Definitiva' | 'Paleativa'; descricao_fechamento: string; tecnico?: string }): Promise<void> {
        const updates: Partial<OrdemServico> = {
            status: 'Concluída',
            data_conclusao: new Date().toISOString(),
            tipo_correcao: dados.tipo_correcao,
            descricao_fechamento: dados.descricao_fechamento,
            updated_at: new Date().toISOString()
        };
        if (dados.tecnico) updates.tecnico_responsavel = dados.tecnico;

        // First update the OS
        const { error } = await supabase
            .from('manutencao_os')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        // Then execute the side effects (machine hours, task updates)
        // We need to fetch the OS first to get maquina_id, etc if not passed.
        // For simplicity, we can fetch it or just rely on the side effects logic if we refactor updateOS.
        // Re-using the logic inside updateOS might be cleaner, but let's just call updateOS with the status change to filter down to that logic?
        // Actually, let's copy the side-effect logic here to be explicit or refactor updateOS to take these fields.

        // Fetch OS to trigger side effects
        const { data: os } = await supabase.from('manutencao_os').select('*').eq('id', id).single();
        if (os) {
            if (os.maquina_id && os.horas_maquina_na_os) {
                await this.updateMaquina(os.maquina_id, {
                    ultima_manutencao_horas: os.horas_maquina_na_os,
                    status: 'Operacional'
                });
            }
            if (os.tarefa_id) {
                try {
                    // @ts-ignore
                    const { projetosService } = await import('./projetosService');
                    await projetosService.updateTarefa(os.tarefa_id, {
                        status: 'CONCLUIDA',
                        progresso: 100,
                        updated_at: new Date().toISOString()
                    });
                } catch (taskError) {
                    console.error('Erro ao atualizar tarefa:', taskError);
                }
            }
        }
    },

    // ==================== ITENS DE MÁQUINA ====================
    async getItensMaquina(maquinaId: string): Promise<MaquinaItem[]> {
        const { data, error } = await supabase
            .from('manutencao_maquina_item')
            .select(`
                *,
                peca_estoque:mecanica_insumo (
                    nome,
                    unidade_medida,
                    quantidade_atual
                )
            `)
            .eq('maquina_id', maquinaId);
        if (error) throw error;
        return data || [];
    },

    async upsertItemMaquina(item: Partial<MaquinaItem>): Promise<void> {
        // Sanitize to remove joined fields not present in table
        const { peca_estoque, ...dbItem } = item;
        const { error } = await supabase
            .from('manutencao_maquina_item')
            .upsert(dbItem);
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
    },

    // ==================== PLANOS DE MANUTENÇÃO ====================
    async getPlanos(): Promise<(ManutencaoPlano & { itens: ManutencaoPlanoItem[] })[]> {
        const { data, error } = await supabase
            .from('manutencao_plano')
            .select(`*, itens:manutencao_plano_item(*)`)
            .order('nome');

        if (error) throw error;
        return data || [];
    },

    async createPlano(plano: Partial<ManutencaoPlano>, itens: Partial<ManutencaoPlanoItem>[]): Promise<void> {
        // 1. Criar Cabeçalho
        const { data: novoPlano, error: errPlano } = await supabase
            .from('manutencao_plano')
            .insert([plano])
            .select()
            .single();

        if (errPlano) throw errPlano;

        // 2. Criar Itens
        if (itens.length > 0) {
            const itensComId = itens.map(i => ({ ...i, plano_id: novoPlano.id }));
            const { error: errItens } = await supabase
                .from('manutencao_plano_item')
                .insert(itensComId);
            if (errItens) throw errItens;
        }
    },

    async vincularPlanoMaquina(maquinaId: string, planoId: string): Promise<void> {
        const { error } = await supabase
            .from('manutencao_maquina_plano')
            .upsert({
                maquina_id: maquinaId,
                plano_id: planoId,
                status_vencimento: 'OK'
            });
        if (error) throw error;
    },

    async getPlanosByMaquina(maquinaId: string): Promise<MaquinaPlanoVinculo[]> {
        const { data, error } = await supabase
            .from('manutencao_maquina_plano')
            .select(`*, plano:manutencao_plano(*)`)
            .eq('maquina_id', maquinaId);
        if (error) throw error;
        return data || [];
    }
};
