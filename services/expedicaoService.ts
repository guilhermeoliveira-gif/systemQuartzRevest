import { prisma } from '../lib/prisma';
import { Carga, CargaPedido } from '../types_expedicao';
import { VendaPedido } from '../types_vendas';

export const expedicaoService = {
    // --- CARGAS ---
    async getCargasAbertas() {
        const data = await prisma.expedicao_carga.findMany({
            where: { status: 'ABERTA' },
            orderBy: { created_at: 'desc' }
        });
        return data as unknown as Carga[];
    },

    async criarCarga(carga: Partial<Carga>) {
        const data = await prisma.expedicao_carga.create({
            data: {
                ...(carga as any),
                id: carga.id || crypto.randomUUID()
            }
        });
        return data as unknown as Carga;
    },

    async fecharCarga(id: string) {
        await prisma.expedicao_carga.update({
            where: { id },
            data: { status: 'FECHADA', updated_at: new Date() }
        });
    },

    async excluirCarga(id: string) {
        await prisma.expedicao_carga.delete({
            where: { id }
        });
    },

    // --- PEDIDOS NA CARGA ---
    async getPedidosDaCarga(cargaId: string) {
        const data = await prisma.expedicao_carga_pedido.findMany({
            where: { carga_id: cargaId },
            include: {
                vendas_pedido_pedido_id: {
                    include: {
                        vendas_cliente_cliente_id: {
                            select: { nome: true, cnpj_cpf: true, contato: true } // Mapear campos reais conforme schema
                        },
                        vendas_item_pedido_id_list: {
                            include: {
                                produto_acabado_produto_id: {
                                    select: { nome: true, unidade_medida: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Mapear para o formato esperado pelo frontend
        return data.map((vinculo: any) => {
            const p = vinculo.vendas_pedido_pedido_id;
            // No frontend o campo é 'cliente' e 'itens'
            // Mas o return data legada do Supabase fazia o mapeamento automático se o select fosse aliasado.
            // Aqui fazemos manual para garantir compatibilidade.
            return {
                ...vinculo,
                pedido: {
                    ...p,
                    cliente: p.vendas_cliente_cliente_id,
                    itens: p.vendas_item_pedido_id_list?.map((it: any) => ({
                        ...it,
                        produto: it.produto_acabado_produto_id
                    }))
                }
            };
        });
    },

    async adicionarPedidoCarga(cargaId: string, pedidoId: string) {
        // 1. Cria vinculo e atualiza pedido em transação
        await prisma.$transaction([
            prisma.expedicao_carga_pedido.create({
                data: {
                    id: crypto.randomUUID(),
                    expedicao_carga_carga_id: { connect: { id: cargaId } },
                    vendas_pedido_pedido_id: { connect: { id: pedidoId } }
                }
            }),
            prisma.vendas_pedido.update({
                where: { id: pedidoId },
                data: { carga_id: cargaId, updated_at: new Date() }
            })
        ]);
    },

    async removerPedidoCarga(cargaId: string, pedidoId: string) {
        // 1. Remove vinculo (Prisma deleteMany para match composto se não tiver ID)
        await prisma.$transaction([
            prisma.expedicao_carga_pedido.deleteMany({
                where: { carga_id: cargaId, pedido_id: pedidoId }
            }),
            prisma.vendas_pedido.update({
                where: { id: pedidoId },
                data: { carga_id: null, updated_at: new Date() }
            })
        ]);
    },

    // --- PEDIDOS DISPONÍVEIS ---
    async getPedidosDisponiveis(filtro: 'TODO' | 'UBERLANDIA' | 'REGIAO' = 'TODO') {
        const dataFiltered = await prisma.vendas_pedido.findMany({
            where: {
                carga_id: null,
                // status: { not: 'CANCELADO' }
            },
            include: {
                vendas_cliente_cliente_id: {
                    select: { nome: true, endereco: true }
                },
                vendas_item_pedido_id_list: {
                    include: {
                        produto_acabado_produto_id: {
                            select: { nome: true }
                        }
                    }
                }
            },
            orderBy: { data_previsao_entrega: 'asc' }
        });

        // Mapear campos para compatibilidade
        const data = dataFiltered.map((p: any) => ({
            ...p,
            cliente: p.vendas_cliente_cliente_id,
            itens: p.vendas_item_pedido_id_list?.map((it: any) => ({
                ...it,
                produto: it.produto_acabado_produto_id
            }))
        }));

        // Filtragem Uberlandia (em memória como no original)
        // Nota: No schema real 'cidade' e 'bairro' parecem estar consolidados em 'endereco' ou faltam no vendas_cliente.
        // Vou assumir que o frontend lida com o que estiver disponível ou filtrar se encontrar o campo.
        // Mas o schema.prisma não mostra 'cidade' em vendas_cliente.
        // Vou manter a estrutura de retorno mas o filtro precisará de ajuste se o campo mudar.

        if (filtro === 'UBERLANDIA') {
            return data.filter((p: any) => p.cliente?.endereco?.toUpperCase().includes('UBERL'));
        } else if (filtro === 'REGIAO') {
            return data.filter((p: any) => !p.cliente?.endereco?.toUpperCase().includes('UBERL'));
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
            const qtd = Number(item.quantidade) || 0;

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
        const data = await prisma.expedicao_pendencia.findMany({
            where: mostrarTodas ? {} : { data_resolvida: null },
            include: {
                vendas_cliente_cliente_id: {
                    select: { id: true, nome: true }
                },
                produto_acabado_produto_id: {
                    select: { id: true, nome: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return data.map((pen: any) => ({
            ...pen,
            cliente: pen.vendas_cliente_cliente_id,
            produto: pen.produto_acabado_produto_id
        }));
    },

    async criarPendencia(pendencia: { cliente_id: string; produto_id: string; quantidade: number; observacao?: string }) {
        const { cliente_id, produto_id, ...rest } = pendencia;
        return await prisma.expedicao_pendencia.create({
            data: {
                ...(rest as any),
                id: crypto.randomUUID(),
                vendas_cliente_cliente_id: { connect: { id: cliente_id } },
                produto_acabado_produto_id: { connect: { id: produto_id } }
            }
        });
    },

    async resolverPendencia(id: string) {
        return await prisma.expedicao_pendencia.update({
            where: { id },
            data: { data_resolvida: new Date(), updated_at: new Date() }
        });
    },

    async verificarPendenciasCliente(clienteId: string): Promise<boolean> {
        const count = await prisma.expedicao_pendencia.count({
            where: {
                cliente_id: clienteId,
                data_resolvida: null
            }
        });
        return count > 0;
    }
};
