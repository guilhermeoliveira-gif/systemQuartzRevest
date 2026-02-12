import { supabase } from './supabaseClient';
import {
    ChecklistModelo,
    ChecklistItemModelo,
    ChecklistAgendamento,
    ChecklistExecucao,
    ChecklistResposta
} from '../types_checklist';
import { qualidadeService } from './qualidadeService';

export const checklistService = {
    // ==================== MODELOS ====================
    async getModelos(): Promise<ChecklistModelo[]> {
        const { data, error } = await supabase
            .from('checklist_modelo')
            .select('*, itens:checklist_item_modelo(*)')
            .order('nome', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async createModelo(modelo: Omit<ChecklistModelo, 'id' | 'created_at' | 'updated_at'>): Promise<ChecklistModelo> {
        const { data, error } = await supabase
            .from('checklist_modelo')
            .insert([modelo])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async createItemModelo(item: Omit<ChecklistItemModelo, 'id' | 'created_at'>): Promise<ChecklistItemModelo> {
        const { data, error } = await supabase
            .from('checklist_item_modelo')
            .insert([item])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ==================== AGENDAMENTOS ====================
    async getAgendamentos(filtro?: { status?: string, responsavel_id?: string }): Promise<ChecklistAgendamento[]> {
        let query = supabase
            .from('checklist_agendamento')
            .select(`
                *,
                modelo:checklist_modelo(nome, area),
                responsavel:usuarios(nome)
            `)
            .order('data_agendada', { ascending: true });

        if (filtro?.status) query = query.eq('status', filtro.status);
        if (filtro?.responsavel_id) query = query.eq('responsavel_id', filtro.responsavel_id);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async createAgendamento(agendamento: Omit<ChecklistAgendamento, 'id' | 'created_at' | 'updated_at'>): Promise<ChecklistAgendamento> {
        const { data, error } = await supabase
            .from('checklist_agendamento')
            .insert([agendamento])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ==================== EXECUÇÃO ====================
    async iniciarExecucao(agendamentoId: string, executorId: string): Promise<ChecklistExecucao> {
        // Atualizar status do agendamento
        await supabase
            .from('checklist_agendamento')
            .update({ status: 'EM_ANDAMENTO' })
            .eq('id', agendamentoId);

        // Criar registro de execução
        const { data, error } = await supabase
            .from('checklist_execucao')
            .insert([{
                agendamento_id: agendamentoId,
                executor_id: executorId,
                status: 'EM_ANDAMENTO',
                data_inicio: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
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
                    responsavel_id: 'CURRENT_USER' // Idealmente o responsável da área
                });
                ncId = nc.id;
            } catch (e) {
                console.error('Erro ao gerar NC automática:', e);
            }
        }

        const { data, error } = await supabase
            .from('checklist_resposta')
            .insert([{ ...resposta, nao_conformidade_id: ncId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async finalizarExecucao(execucaoId: string, agendamentoId: string): Promise<void> {
        // Finalizar Execução
        await supabase
            .from('checklist_execucao')
            .update({
                status: 'FINALIZADO',
                data_fim: new Date().toISOString()
            })
            .eq('id', execucaoId);

        // Finalizar Agendamento
        await supabase
            .from('checklist_agendamento')
            .update({ status: 'CONCLUIDO' })
            .eq('id', agendamentoId);
    }
};
