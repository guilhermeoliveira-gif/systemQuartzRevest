import { supabase } from '../supabaseClient';
import {
    Fornecedor,
    PedidoCompra,
    ItemPedidoCompra,
    Cotacao,
    ItemCotacao,
    CotacaoFornecedor,
    PropostaCotacao,
    ItemProposta
} from '../types_compras';

export const comprasService = {
    // --- FORNECEDORES ---
    async getFornecedores() {
        const { data, error } = await supabase
            .from('fornecedores')
            .select('*')
            .abortSignal(AbortSignal.timeout(15000))
            .order('nome');
        if (error) throw error;
        return data as Fornecedor[];
    },

    async createFornecedor(fornecedor: Omit<Fornecedor, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('fornecedores')
            .insert(fornecedor)
            .select()
            .single();
        if (error) throw error;
        return data as Fornecedor;
    },

    // --- PEDIDOS DE COMPRA ---
    async getPedidos() {
        const { data, error } = await supabase
            .from('pedidos_compra')
            .select(`
        *,
        itens:itens_pedido_compra(*)
      `)
            .abortSignal(AbortSignal.timeout(20000))
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as PedidoCompra[];
    },

    async getPedidoById(id: string) {
        const { data, error } = await supabase
            .from('pedidos_compra')
            .select(`
        *,
        itens:itens_pedido_compra(*)
      `)
            .eq('id', id)
            .single();
        if (error) throw error;
        return data as PedidoCompra;
    },

    async createPedido(pedido: Omit<PedidoCompra, 'id' | 'created_at' | 'itens'>, itens: Omit<ItemPedidoCompra, 'id' | 'pedido_id'>[]) {
        // Start a transaction implicitly by doing sequential operations. If one fails, we might leave partial data.
        // Ideally use RPC for atomicity, but for MVP standard calls are fine.

        // 1. Create Pedido
        const { data: novoPedido, error: pedidoError } = await supabase
            .from('pedidos_compra')
            .insert(pedido)
            .select()
            .abortSignal(AbortSignal.timeout(20000))
            .single();

        if (pedidoError) throw pedidoError;

        // 2. Create Itens
        if (itens.length > 0) {
            const itensComId = itens.map(item => ({
                ...item,
                pedido_id: novoPedido.id
            }));

            const { error: itensError } = await supabase
                .from('itens_pedido_compra')
                .insert(itensComId)
                .abortSignal(AbortSignal.timeout(20000));

            if (itensError) {
                // Rollback strategy: delete created pedido (optional for MVP)
                await supabase.from('pedidos_compra').delete().eq('id', novoPedido.id);
                throw itensError;
            }
        }

        return novoPedido;
    },

    async updateStatusPedido(id: string, status: string) {
        const { error } = await supabase
            .from('pedidos_compra')
            .update({ status })
            .eq('id', id);
        if (error) throw error;
    },

    // --- COTAÇÕES ---
    async getCotacoes() {
        const { data, error } = await supabase
            .from('cotacoes')
            .select(`
        *,
        pedido:pedidos_compra(titulo, codigo),
        fornecedores:cotacao_fornecedores(count),
        propostas(count)
      `)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getCotacoesByPedidoId(pedidoId: string) {
        const { data, error } = await supabase
            .from('cotacoes')
            .select(`
                *,
                fornecedores:cotacao_fornecedores(count),
                propostas(count)
            `)
            .eq('pedido_id', pedidoId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as (Cotacao & { fornecedores: { count: number }[], propostas: { count: number }[] })[];
    },

    async getCotacaoById(id: string) {
        const { data, error } = await supabase
            .from('cotacoes')
            .select(`
        *,
        itens:itens_cotacao(*),
        convidados:cotacao_fornecedores(
            *,
            fornecedor:fornecedores(*)
        ),
        propostas:propostas(
            *,
            fornecedor:fornecedores(*),
            itens:itens_proposta(*)
        )
      `)
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async createCotacao(cotacao: Omit<Cotacao, 'id' | 'created_at'>, itensPedido: ItemPedidoCompra[]) {
        // 1. Create Cotacao
        const { data: novaCotacao, error: cotacaoError } = await supabase
            .from('cotacoes')
            .insert(cotacao)
            .select()
            .single();

        if (cotacaoError) throw cotacaoError;

        // 2. Create Itens Cotacao based on Pedido Items
        if (itensPedido.length > 0) {
            const itensCotacao = itensPedido.map(item => ({
                cotacao_id: novaCotacao.id,
                item_pedido_id: item.id,
                descricao: item.descricao,
                quantidade: item.quantidade,
                unidade: item.unidade
            }));

            const { error: itensError } = await supabase
                .from('itens_cotacao')
                .insert(itensCotacao);

            if (itensError) throw itensError;
        }

        // Update Pedido Status
        if (cotacao.pedido_id) {
            await supabase
                .from('pedidos_compra')
                .update({ status: 'EM_COTACAO' })
                .eq('id', cotacao.pedido_id);
        }

        return novaCotacao;
    },

    async addFornecedorCotacao(cotacaoId: string, fornecedorId: string) {
        const { error } = await supabase
            .from('cotacao_fornecedores')
            .insert({ cotacao_id: cotacaoId, fornecedor_id: fornecedorId });
        if (error) throw error;
    },

    // --- PROPOSTAS ---
    async registrarProposta(
        cotacaoId: string,
        fornecedorId: string,
        valorTotal: number,
        itens: { item_cotacao_id: string, preco_unitario: number, quantidade: number }[]
    ) {
        // 1. Create Proposta Headers
        const { data: proposta, error: propostaError } = await supabase
            .from('propostas')
            .insert({
                cotacao_id: cotacaoId,
                fornecedor_id: fornecedorId,
                valor_total: valorTotal,
                status: 'RECEBIDA' // Assuming we add status column or infer
            })
            .select()
            .single();

        if (propostaError) throw propostaError;

        // 2. Create Items
        const itensProposta = itens.map(item => ({
            proposta_id: proposta.id,
            item_cotacao_id: item.item_cotacao_id,
            preco_unitario: item.preco_unitario,
            quantidade_ofertada: item.quantidade,
            valor_total_item: item.preco_unitario * item.quantidade
        }));

        const { error: itensError } = await supabase
            .from('itens_proposta')
            .insert(itensProposta);

        if (itensError) throw itensError;

        return proposta;
    },

    async marcarVencedora(propostaId: string) {
        // Update proposal
        const { error } = await supabase
            .from('propostas')
            .update({ is_vencedora: true })
            .eq('id', propostaId);

        if (error) throw error;
    }
};
