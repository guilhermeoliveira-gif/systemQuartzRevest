
import { supabase } from './supabaseClient';
import { MateriaPrima, MecanicaInsumo, EntradaMateriaPrima, ProdutoAcabado, ProducaoRegistro, MovimentoPeca } from '../types';
import { logger } from '../utils/logger';

class StoreService {
    private static instance: StoreService;

    private constructor() { }

    public static getInstance(): StoreService {
        if (!StoreService.instance) {
            StoreService.instance = new StoreService();
        }
        return StoreService.instance;
    }

    // --- Materia Prima ---
    public async getMateriasPrimas(): Promise<MateriaPrima[]> {
        const { data, error } = await supabase
            .from('materia_prima')
            .select('*')
            .order('nome');

        if (error) {
            logger.error('Erro ao buscar matérias-primas', error);
            throw error;
        }
        return data || [];
    }

    // Helper para atualizar estoque e custo médio
    public async updateMateriaPrimaStock(id: string, quantityToAdd: number, costTotal?: number): Promise<void> {
        // 1. Buscar item atual
        const { data: item, error: fetchError } = await supabase
            .from('materia_prima')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !item) {
            const error = fetchError || new Error('Item not found');
            logger.error(`Erro ao buscar matéria-prima ${id}`, error);
            throw error;
        }

        let novoCustoUnitario = item.custo_unitario;
        const novaQuantidade = Number(item.quantidade_atual) + quantityToAdd;

        // 2. Calcular Custo Médio (se for entrada positiva e tiver valor)
        if (quantityToAdd > 0 && costTotal && costTotal > 0) {
            const valorAtual = Number(item.quantidade_atual) * Number(item.custo_unitario);
            const novoValorTotal = valorAtual + costTotal;
            if (novaQuantidade > 0) {
                // Previne divisão por zero
                novoCustoUnitario = novoValorTotal / novaQuantidade;
            }
        }

        // 3. Persistir
        const { error } = await supabase
            .from('materia_prima')
            .update({
                quantidade_atual: novaQuantidade,
                custo_unitario: novoCustoUnitario
            })
            .eq('id', id);

        if (error) {
            logger.error(`Erro ao atualizar estoque da matéria-prima ${id}`, error);
            throw error;
        }
    }

    // --- Entrada Materia Prima ---
    public async addEntrada(entrada: Omit<EntradaMateriaPrima, 'id' | 'data_entrada' | 'estornado'>): Promise<void> {
        // 1. Inserir Registro de Entrada
        const { error: insertError } = await supabase
            .from('entrada_materia_prima')
            .insert({
                ...entrada,
                estornado: false
                // data_entrada é gerado pelo default do banco ou trigger, mas podemos mandar se necessário
            });

        if (insertError) {
            logger.error('Erro ao adicionar entrada de matéria-prima', insertError);
            throw insertError;
        }

        // 2. Atualizar Estoque (Cálculo de Média)
        // Nota: O ideal seria usar uma RPC/Transaction no banco para garantir atomicidade
        await this.updateMateriaPrimaStock(entrada.materia_prima_id, entrada.quantidade, entrada.custo_total_nota);
        logger.info(`Entrada de matéria-prima registrada: ${entrada.materia_prima_id} (${entrada.quantidade})`);
    }

    public async estornarEntrada(entradaId: string): Promise<boolean> {
        // 1. Buscar Entrada
        const { data: entry, error: fetchError } = await supabase
            .from('entrada_materia_prima')
            .select('*')
            .eq('id', entradaId)
            .single();

        if (fetchError || !entry || entry.estornado) {
            logger.warn(`Tentativa de estorno inválida para entrada ${entradaId}`);
            return false;
        }

        // 2. Marcar como Estornado
        const { error: updateError } = await supabase
            .from('entrada_materia_prima')
            .update({ estornado: true })
            .eq('id', entradaId);

        if (updateError) {
            logger.error(`Erro ao marcar entrada ${entradaId} como estornada`, updateError);
            return false;
        }

        // 3. Reverter Estoque (Nota: Custo Médio não é revertido perfeitamente aqui, apenas qtd)
        // Passamos negativo para reduzir o estoque
        await this.updateMateriaPrimaStock(entry.materia_prima_id, -Number(entry.quantidade));
        logger.info(`Entrada ${entradaId} estornada com sucesso`);
        return true;
    }

    public async getHistoricoEntradas(): Promise<EntradaMateriaPrima[]> {
        const { data, error } = await supabase
            .from('entrada_materia_prima')
            .select(`
                *,
                materia_prima (
                    nome,
                    unidade_medida
                )
            `)
            .order('data_entrada', { ascending: false });

        if (error) {
            logger.error('Erro ao buscar histórico de entradas', error);
            throw error;
        }
        // Mapear para incluir nome da MP se necessário ou retornar direto
        return data || [];
    }

    // --- Produto Acabado ---
    public async getProdutosAcabados(): Promise<ProdutoAcabado[]> {
        const { data, error } = await supabase
            .from('produto_acabado')
            .select('*')
            .order('nome');

        if (error) {
            logger.error('Erro ao buscar produtos acabados', error);
            throw error;
        }
        return data || [];
    }

    public async addProducao(registro: Omit<ProducaoRegistro, 'id' | 'data_producao'>): Promise<void> {
        // 1. Registrar Produção
        const { error: insertError } = await supabase
            .from('producao_registro')
            .insert({
                ...registro,
                // data_producao: default now()
            });

        if (insertError) {
            logger.error('Erro ao registrar produção', insertError);
            throw insertError;
        }

        // 2. Atualizar Estoque do PA
        const { data: produto, error: fetchError } = await supabase
            .from('produto_acabado')
            .select('*')
            .eq('id', registro.produto_acabado_id)
            .single();

        if (fetchError || !produto) {
            logger.error(`Produto acabado ${registro.produto_acabado_id} não encontrado`, fetchError);
            throw fetchError || new Error('Produto Acabado not found');
        }

        const novaQtd = Number(produto.quantidade_atual) + Number(registro.quantidade_produzida);

        const { error: updateError } = await supabase
            .from('produto_acabado')
            .update({ quantidade_atual: novaQtd })
            .eq('id', registro.produto_acabado_id);

        if (updateError) {
            logger.error(`Erro ao atualizar estoque do produto acabado ${registro.produto_acabado_id}`, updateError);
            throw updateError;
        }

        logger.info(`Produção registrada: ${registro.produto_acabado_id} (+${registro.quantidade_produzida})`);
    }

    // --- Peças e Insumos ---
    public async getPecasInsumos(): Promise<MecanicaInsumo[]> {
        // Usar join para trazer relacionamento com máquinas se necessário
        const { data, error } = await supabase
            .from('mecanica_insumo')
            .select(`
                *,
                mecanica_insumo_maquina (
                    maquina_id
                )
            `)
            .order('nome');

        if (error) {
            logger.error('Erro ao buscar peças e insumos', error);
            throw error;
        }

        // Transformar dados para incluir array de maquina_ids para facilitar frontend
        return (data || []).map((peca: any) => ({
            ...peca,
            maquina_ids: peca.mecanica_insumo_maquina?.map((m: any) => m.maquina_id) || []
        }));
    }

    public async addMovimentoPeca(movimento: Omit<MovimentoPeca, 'id' | 'data_movimento'>): Promise<void> {
        // 1. Inserir Movimento
        const { error: movError } = await supabase
            .from('movimento_peca')
            .insert({
                ...movimento,
                tipo: movimento.quantidade > 0 ? 'ENTRADA' : 'SAIDA'
                // data_movimento default now()
            });

        if (movError) {
            logger.error('Erro ao registrar movimento de peça', movError);
            throw movError;
        }

        // 2. Atualizar Estoque
        const { data: item, error: fetchError } = await supabase
            .from('mecanica_insumo')
            .select('*')
            .eq('id', movimento.peca_id)
            .single();

        if (fetchError || !item) {
            logger.error(`Peça ${movimento.peca_id} não encontrada`, fetchError);
            throw fetchError || new Error('Item not found');
        }

        const novaQuantidade = Number(item.quantidade_atual) + Number(movimento.quantidade);

        const { error: updateError } = await supabase
            .from('mecanica_insumo')
            .update({ quantidade_atual: novaQuantidade })
            .eq('id', movimento.peca_id);

        if (updateError) {
            logger.error(`Erro ao atualizar saldo da peça ${movimento.peca_id}`, updateError);
            throw updateError;
        }

        logger.info(`Movimento de peça registrado: ${movimento.peca_id} (${movimento.quantidade})`);
    }

    // CRUD Genérico para Peças
    public async createPeca(peca: Partial<MecanicaInsumo>, maquinaIds: string[]): Promise<void> {
        // 1. Criar Peça
        // Remover campos auxiliares que não existem na tabela
        const { maquina_ids, ...pecaData } = peca as any;

        const { data: newPeca, error } = await supabase
            .from('mecanica_insumo')
            .insert([pecaData])
            .select()
            .single();

        if (error) {
            logger.error('Erro ao criar peça', error);
            throw error;
        }

        // 2. Vincular Ás Máquinas (N:N)
        if (maquinaIds && maquinaIds.length > 0) {
            const links = maquinaIds.map(mid => ({
                mecanica_insumo_id: newPeca.id,
                maquina_id: mid
            }));

            const { error: linkError } = await supabase
                .from('mecanica_insumo_maquina')
                .insert(links);

            if (linkError) {
                logger.error('Erro ao vincular peça às máquinas', linkError);
                // Não falha operação principal, mas loga erro
            }
        }

        logger.info(`Peça criada: ${newPeca.id}`);
    }

    public async updatePeca(id: string, updates: Partial<MecanicaInsumo>, maquinaIds?: string[]): Promise<void> {
        // 1. Atualizar dados básicos
        const { maquina_ids, ...updateData } = updates as any;

        const { error } = await supabase
            .from('mecanica_insumo')
            .update(updateData)
            .eq('id', id);

        if (error) {
            logger.error(`Erro ao atualizar peça ${id}`, error);
            throw error;
        }

        // 2. Atualizar Vínculos (Se fornecido)
        if (maquinaIds !== undefined) {
            // Remove antigos
            await supabase
                .from('mecanica_insumo_maquina')
                .delete()
                .eq('mecanica_insumo_id', id);

            // Adiciona novos
            if (maquinaIds.length > 0) {
                const links = maquinaIds.map(mid => ({
                    mecanica_insumo_id: id,
                    maquina_id: mid
                }));
                await supabase
                    .from('mecanica_insumo_maquina')
                    .insert(links);
            }
        }

        logger.info(`Peça atualizada: ${id}`);
    }

    public async deletePeca(id: string): Promise<void> {
        const { error } = await supabase
            .from('mecanica_insumo')
            .delete()
            .eq('id', id);

        if (error) {
            logger.error(`Erro ao excluir peça ${id}`, error);
            throw error;
        }

        logger.info(`Peça excluída: ${id}`);
    }
}

export const store = StoreService.getInstance();
