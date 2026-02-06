
import { supabase } from './supabaseClient';
import { MateriaPrima, MecanicaInsumo, EntradaMateriaPrima, ProdutoAcabado, ProducaoRegistro, MovimentoPeca } from '../types';

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

        if (error) throw error;
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

        if (fetchError || !item) throw fetchError || new Error('Item not found');

        let novoCustoUnitario = item.custo_unitario;
        const novaQuantidade = Number(item.quantidade_atual) + quantityToAdd;

        // 2. Calcular Custo Médio (se for entrada positiva e tiver valor)
        if (quantityToAdd > 0 && costTotal && costTotal > 0) {
            const valorAtual = Number(item.quantidade_atual) * Number(item.custo_unitario);
            const novoValorTotal = valorAtual + costTotal;
            if (novaQuantidade > 0) {
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

        if (error) throw error;
    }

    // --- Entrada Materia Prima ---
    public async addEntrada(entrada: Omit<EntradaMateriaPrima, 'id' | 'data_entrada' | 'estornado'>): Promise<void> {
        // 1. Inserir Registro de Entrada
        const { error: insertError } = await supabase
            .from('entrada_materia_prima')
            .insert({
                ...entrada,
                data_entrada: new Date().toISOString(),
                estornado: false
            });

        if (insertError) throw insertError;

        // 2. Atualizar Estoque (Cálculo de Média)
        await this.updateMateriaPrimaStock(entrada.materia_prima_id, entrada.quantidade, entrada.custo_total_nota);
    }

    public async estornarEntrada(entradaId: string): Promise<boolean> {
        // 1. Buscar Entrada
        const { data: entry, error: fetchError } = await supabase
            .from('entrada_materia_prima')
            .select('*')
            .eq('id', entradaId)
            .single();

        if (fetchError || !entry || entry.estornado) return false;

        // 2. Marcar como Estornado
        const { error: updateError } = await supabase
            .from('entrada_materia_prima')
            .update({ estornado: true })
            .eq('id', entradaId);

        if (updateError) return false;

        // 3. Reverter Estoque (Nota: Custo Médio não é revertido perfeitamente aqui, apenas qtd)
        // Passamos negativo para reduzir o estoque
        await this.updateMateriaPrimaStock(entry.materia_prima_id, -Number(entry.quantidade));

        return true;
    }

    public async getHistoricoEntradas(): Promise<EntradaMateriaPrima[]> {
        const { data, error } = await supabase
            .from('entrada_materia_prima')
            .select('*')
            .order('data_entrada', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    // --- Pecas e Insumos ---
    public async getPecas(): Promise<MecanicaInsumo[]> {
        const { data, error } = await supabase
            .from('mecanica_insumo')
            .select('*')
            .order('nome');

        if (error) throw error;
        return data || [];
    }

    public async addPeca(peca: Omit<MecanicaInsumo, 'id'>): Promise<void> {
        const { error } = await supabase.from('mecanica_insumo').insert(peca);
        if (error) throw error;
    }

    public async updatePeca(id: string, updates: Partial<MecanicaInsumo>): Promise<void> {
        const { error } = await supabase
            .from('mecanica_insumo')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
    }

    public async updatePecaInsumoStock(id: string, quantityToAdd: number): Promise<void> {
        // Usar RPC ou lógica fetch-update. Aqui faremos fetch-update simples.
        const { data: item } = await supabase.from('mecanica_insumo').select('quantidade_atual').eq('id', id).single();
        if (!item) return;

        const novaQtd = Number(item.quantidade_atual) + quantityToAdd;

        const { error } = await supabase
            .from('mecanica_insumo')
            .update({ quantidade_atual: novaQtd < 0 ? 0 : novaQtd })
            .eq('id', id);

        if (error) throw error;
    }

    public async registerMovimentacaoPeca(
        pecaId: string,
        tipo: 'ENTRADA' | 'SAIDA',
        quantidade: number,
        motivo: string,
        userId: string
    ): Promise<void> {
        // 1. Registrar Movimento
        const { error: movError } = await supabase
            .from('movimento_peca')
            .insert({
                peca_id: pecaId,
                tipo,
                quantidade,
                motivo_maquina: motivo,
                usuario_id: userId,
                data_movimento: new Date().toISOString()
            });

        if (movError) throw movError;

        // 2. Atualizar Estoque
        const qtdReal = tipo === 'ENTRADA' ? quantidade : -quantidade;
        await this.updatePecaInsumoStock(pecaId, qtdReal);
    }

    public async deletePeca(id: string): Promise<void> {
        const { error } = await supabase.from('mecanica_insumo').delete().eq('id', id);
        if (error) throw error;
    }

    public async getHistoricoMovimentacoes(): Promise<MovimentoPeca[]> {
        const { data, error } = await supabase
            .from('movimento_peca')
            .select(`
                *,
                peca:mecanica_insumo(nome, unidade_medida)
            `)
            .order('data_movimento', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Map the joined data if necessary, or let the component handle it.
        // Supabase returns nested objects for joins. 
        // We might need to adjust the type definition of MovimentoPeca to include 'peca' optional property
        return data || [];
    }

    // --- Produtos Acabados ---
    public async getProdutosAcabados(): Promise<ProdutoAcabado[]> {
        const { data, error } = await supabase
            .from('produto_acabado')
            .select('*')
            .order('nome');

        if (error) throw error;
        return data || [];
    }

    public async addProducao(producao: Omit<ProducaoRegistro, 'id' | 'data_producao' | 'desvio_status' | 'estornado'>): Promise<void> {
        // 1. Registrar Produção
        const { error } = await supabase
            .from('producao_registro')
            .insert({
                ...producao,
                data_producao: new Date().toISOString(),
                desvio_status: 'OK',
                estornado: false
            });

        if (error) throw error;

        // 2. Aumentar Estoque PA
        const { data: pa } = await supabase
            .from('produto_acabado')
            .select('quantidade_atual')
            .eq('id', producao.produto_acabado_id)
            .single();

        if (pa) {
            await supabase
                .from('produto_acabado')
                .update({ quantidade_atual: Number(pa.quantidade_atual) + producao.quantidade_produzida })
                .eq('id', producao.produto_acabado_id);
        }

        // 3. Backflushing Simulado (Baixar Cimento)
        // Hardcoded para demonstração
        const { data: cimento } = await supabase
            .from('materia_prima')
            .select('id, quantidade_atual')
            .ilike('nome', '%Cimento%')
            .maybeSingle();

        if (cimento) {
            const consumo = producao.quantidade_produzida * 0.5; // Simulação
            await this.updateMateriaPrimaStock(cimento.id, -consumo);
        }
    }

    public async getHistoricoProducao(): Promise<ProducaoRegistro[]> {
        const { data, error } = await supabase
            .from('producao_registro')
            .select('*')
            .order('data_producao', { ascending: false });

        if (error) throw error;
        return data || [];
    }
}

export const store = StoreService.getInstance();
