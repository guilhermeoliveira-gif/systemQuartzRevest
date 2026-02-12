import { supabase } from './supabaseClient';
import { Carga, CargaPedido } from '../types_expedicao';
import { VendaPedido } from '../types_vendas';

export const expedicaoService = {
    // --- CARGAS ---
    async getCargasAbertas() {
        const { data, error } = await supabase
            .from('expedicao_carga')
            .select('*')
            .eq('status', 'ABERTA')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Carga[];
    },

    async criarCarga(carga: Partial<Carga>) {
        const { data, error } = await supabase
            .from('expedicao_carga')
            .insert(carga)
            .select()
            .single();
        if (error) throw error;
        return data as Carga;
    },

    async fecharCarga(id: string) {
        const { error } = await supabase
            .from('expedicao_carga')
            .update({ status: 'FECHADA' })
            .eq('id', id);
        if (error) throw error;
    },

    async excluirCarga(id: string) {
        // Primeiro remove vínculos (cascade deve cuidar, mas por segurança...)
        const { error } = await supabase
            .from('expedicao_carga')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // --- PEDIDOS NA CARGA ---
    async getPedidosDaCarga(cargaId: string) {
        const { data, error } = await supabase
            .from('expedicao_carga_pedido')
            .select(`
                *,
                pedido:vendas_pedido (
                    *,
                    cliente:vendas_cliente(nome, cidade, bairro),
                    itens:vendas_item (
                        quantidade,
                        produto:produto_acabado(nome, unidade_medida)
                    )
                )
            `)
            .eq('carga_id', cargaId);

        if (error) throw error;
        return data;
    },

    async adicionarPedidoCarga(cargaId: string, pedidoId: string) {
        // 1. Cria vinculo
        const { error } = await supabase
            .from('expedicao_carga_pedido')
            .insert({ carga_id: cargaId, pedido_id: pedidoId });
        if (error) throw error;

        // 2. Atualiza flag no pedido
        await supabase
            .from('vendas_pedido')
            .update({ carga_id: cargaId })
            .eq('id', pedidoId);
    },

    async removerPedidoCarga(cargaId: string, pedidoId: string) {
        // 1. Remove vinculo
        const { error } = await supabase
            .from('expedicao_carga_pedido')
            .delete()
            .match({ carga_id: cargaId, pedido_id: pedidoId });
        if (error) throw error;

        // 2. Limpa flag no pedido
        await supabase
            .from('vendas_pedido')
            .update({ carga_id: null })
            .eq('id', pedidoId);
    },

    // --- PEDIDOS DISPONÍVEIS ---
    async getPedidosDisponiveis(filtro: 'TODO' | 'UBERLANDIA' | 'REGIAO' = 'TODO') {
        let query = supabase
            .from('vendas_pedido')
            .select(`
                *,
                cliente:vendas_cliente(nome, cidade, bairro, endereco),
                itens:vendas_item(quantidade, produto:produto_acabado(nome))
            `)
            .is('carga_id', null) // Apenas sem carga
            // .neq('status', 'CANCELADO') // Ignora cancelados
            .order('data_previsao_entrega', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;

        // Filtragem em memória devido a complexidade de cidade/região string
        if (filtro === 'UBERLANDIA') {
            return data.filter((p: any) => p.cliente?.cidade?.toUpperCase().includes('UBERL'));
        } else if (filtro === 'REGIAO') {
            return data.filter((p: any) => !p.cliente?.cidade?.toUpperCase().includes('UBERL'));
        }

        return data;
    },

    // --- CÁLCULOS (Lógica Legada) ---
    calcularPesoEPaletes(itens: any[]) {
        let pesoTotal = 0;
        let totalArgamassa = 0; // Sacos
        let totalRejunte = 0; // Kg/Un

        itens.forEach(item => {
            const nome = item.produto?.nome?.toUpperCase() || '';
            const qtd = item.quantidade || 0;

            if (nome.includes('REJUNT')) {
                totalRejunte += qtd;
                pesoTotal += qtd * 1; // 1kg por unidade (aprox legado)
            } else {
                totalArgamassa += qtd;
                pesoTotal += qtd * 20; // 20kg por saco padrão
            }
        });

        // Cálculo Paletes Argamassa (72 sacos = 1 palete)
        const paletesArgamassa = Math.ceil(totalArgamassa / 72);

        // Cálculo Paletes Rejunte (Legado: > 1000kg = 1 palete)
        const paletesRejunte = totalRejunte > 1000 ? 1 : 0;

        return {
            pesoTotal,
            paletesTotal: paletesArgamassa + paletesRejunte,
            qtdArgamassa: totalArgamassa,
            qtdRejunte: totalRejunte
        };
    }
};
