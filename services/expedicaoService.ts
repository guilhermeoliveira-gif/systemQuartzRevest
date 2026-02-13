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
        try {
            const { data, error } = await supabase
                .from('vendas_pedido')
                .select(`
                    *,
                    cliente:vendas_cliente(nome, cidade, bairro, endereco),
                    itens:vendas_item(
                        quantidade, 
                        produto:produto_acabado(nome)
                    )
                `)
                .is('carga_id', null)
                .order('data_previsao_entrega', { ascending: true });

            if (error) {
                console.error('Erro em getPedidosDisponiveis:', error);
                throw error;
            }

            console.log('Pedidos carregados:', data?.length);

            if (!data) return [];

            // Filtragem em memória
            if (filtro === 'UBERLANDIA') {
                return data.filter((p: any) => p.cliente?.cidade?.toUpperCase().includes('UBERL'));
            } else if (filtro === 'REGIAO') {
                return data.filter((p: any) => !p.cliente?.cidade?.toUpperCase().includes('UBERL'));
            }

            return data;
        } catch (err) {
            console.error('Catch getPedidosDisponiveis:', err);
            throw err;
        }
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
    },

    // --- PENDÊNCIAS ---
    async listarPendencias(mostrarTodas: boolean = false) {
        let query = supabase
            .from('expedicao_pendencia')
            .select(`
                *,
                cliente:vendas_cliente(id, nome),
                produto:produto_acabado(id, nome, codigo)
            `)
            .order('created_at', { ascending: false });

        if (!mostrarTodas) {
            query = query.is('data_resolvida', null);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async criarPendencia(pendencia: { cliente_id: string; produto_id: string; quantidade: number; observacao?: string }) {
        const { data, error } = await supabase
            .from('expedicao_pendencia')
            .insert(pendencia)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async resolverPendencia(id: string) {
        const { data, error } = await supabase
            .from('expedicao_pendencia')
            .update({ data_resolvida: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async verificarPendenciasCliente(clienteId: string): Promise<boolean> {
        try {
            if (!clienteId) return false;

            const { count, error } = await supabase
                .from('expedicao_pendencia')
                .select('*', { count: 'exact', head: true })
                .eq('cliente_id', clienteId)
                .is('data_resolvida', null);

            if (error) {
                console.error('Supabase error checking pendencies:', error);
                // Don't throw, just return false to avoid blocking the UI flow, 
                // but log strictly.
                return false;
            }
            return (count || 0) > 0;
        } catch (err) {
            console.error('Unexpected error checking pendencies:', err);
            return false;
        }
    },

    async getMotoristas() {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, nome, perfil:perfil_id!inner(nome)')
                .eq('ativo', true);

            if (error) {
                console.error('Supabase error in getMotoristas:', error);
                throw error;
            }

            // Filtrar em memória se necessário ou usar o join
            const motoristas = data
                .filter((u: any) => u.perfil?.nome === 'Motorista')
                .map((u: any) => ({ id: u.id, nome: u.nome }));

            return motoristas;
        } catch (err) {
            console.error('Catch error in getMotoristas:', err);
            throw err;
        }
    },

    async getVeiculos() {
        try {
            const { data, error } = await supabase
                .from('frota_veiculos')
                .select('id, placa, modelo, marca')
                .eq('status', 'ATIVO');

            if (error) {
                console.error('Erro em getVeiculos:', error);
                throw error;
            }
            return data;
        } catch (err) {
            console.error('Catch getVeiculos:', err);
            throw err;
        }
    }
};
