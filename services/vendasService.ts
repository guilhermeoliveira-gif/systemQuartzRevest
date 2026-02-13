import { supabase } from './supabaseClient';
import { VendaCliente, VendaPedido, VendaItem } from '../types_vendas';
import { EstoquePA } from '../types_estoque';

export const vendasService = {
    // --- CLIENTES ---
    async getClientes() {
        const { data, error } = await supabase
            .from('vendas_cliente')
            .select('*')
            .order('nome');
        if (error) throw error;
        return data as VendaCliente[];
    },

    async getClienteById(id: string) {
        const { data, error } = await supabase
            .from('vendas_cliente')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data as VendaCliente[];
    },

    async criarCliente(cliente: Omit<VendaCliente, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('vendas_cliente')
            .insert(cliente)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async atualizarCliente(id: string, cliente: Partial<VendaCliente>) {
        const { data, error } = await supabase
            .from('vendas_cliente')
            .update(cliente)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // --- PRODUTOS (Integração Estoque PA) ---
    async buscarProdutos(query: string) {
        const { data, error } = await supabase
            .from('produto_acabado')
            .select('id, nome, unidade_medida') // Ajustado para colunas reais
            .ilike('nome', `%${query}%`)
            .limit(20);

        if (error) throw error;
        // Map para interface EstoquePA (compatibilidade)
        return data.map((p: any) => ({
            id: p.id,
            nome: p.nome, // Correctly mapping the name
            descricao: p.nome, // Alias kept for compatibility
            // codigo: removed fake code generation from ID
            unidade: p.unidade_medida
        })) as EstoquePA[];
    },

    // --- PEDIDOS ---
    async getPedidos() {
        const { data, error } = await supabase
            .from('vendas_pedido')
            .select(`
        *,
        cliente:vendas_cliente(nome)
      `)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getPedidoById(id: string) {
        // Busca Cabeçalho
        const { data: pedido, error: errPedido } = await supabase
            .from('vendas_pedido')
            .select(`*, cliente:vendas_cliente(*)`)
            .eq('id', id)
            .single();
        if (errPedido) throw errPedido;

        // Busca Itens
        const { data: itens, error: errItens } = await supabase
            .from('vendas_item')
            .select(`*, produto:produto_acabado(nome, unidade_medida)`)
            .eq('pedido_id', id);
        if (errItens) throw errItens;

        return { ...pedido, itens };
    },

    async criarPedido(pedido: Partial<VendaPedido>, itens: Partial<VendaItem>[]) {
        // 1. Criar Cabeçalho
        const { data: novoPedido, error: errPedido } = await supabase
            .from('vendas_pedido')
            .insert(pedido)
            .select()
            .single();

        if (errPedido) throw errPedido;

        // 2. Criar Itens
        const itensComPedido = itens.map(item => {
            // Remover propriedades virtuais (produto) e colunas geradas (valor_total)
            const { produto, valor_total, ...itemData } = item as any;
            return {
                ...itemData,
                pedido_id: novoPedido.id
            };
        });

        const { error: errItens } = await supabase
            .from('vendas_item')
            .insert(itensComPedido);

        if (errItens) {
            // Rollback manual se falhar itens (básico)
            await supabase.from('vendas_pedido').delete().eq('id', novoPedido.id);
            throw errItens;
        }

        return novoPedido;
    },

    // Utilitário Data Previsão (Lógica Legada C#)
    calcularPrevisaoEntrega(diasUteis: number = 3): Date {
        let data = new Date();
        let adicionados = 0;
        while (adicionados < diasUteis) {
            data.setDate(data.getDate() + 1);
            if (data.getDay() !== 0) { // Domingo = 0
                adicionados++;
            }
        }
        return data;
    }
};
