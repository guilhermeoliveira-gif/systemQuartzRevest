import { prisma } from '../lib/prisma';
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
        const data = await prisma.fornecedores.findMany({
            orderBy: { nome: 'asc' }
        });
        return data as unknown as Fornecedor[];
    },

    async createFornecedor(fornecedor: Omit<Fornecedor, 'id' | 'created_at'>) {
        const data = await prisma.fornecedores.create({
            data: fornecedor as any
        });
        return data as unknown as Fornecedor;
    },

    // --- PEDIDOS DE COMPRA ---
    async getPedidos() {
        const data = await prisma.pedidos_compra.findMany({
            include: {
                itens: true
            },
            orderBy: { created_at: 'desc' }
        });
        return data as unknown as PedidoCompra[];
    },

    async getPedidoById(id: string) {
        const data = await prisma.pedidos_compra.findUnique({
            where: { id },
            include: {
                itens: true
            }
        });
        return data as unknown as PedidoCompra;
    },

    async createPedido(pedido: Omit<PedidoCompra, 'id' | 'created_at' | 'itens'>, itens: Omit<ItemPedidoCompra, 'id' | 'pedido_id'>[]) {
        const data = await prisma.pedidos_compra.create({
            data: {
                ...(pedido as any),
                itens: {
                    create: itens as any
                }
            },
            include: {
                itens: true
            }
        });

        return data as unknown as PedidoCompra;
    },

    async updateStatusPedido(id: string, status: string) {
        await prisma.pedidos_compra.update({
            where: { id },
            data: { status }
        });
    },

    // --- COTAÇÕES ---
    async getCotacoes() {
        const data = await prisma.cotacoes.findMany({
            include: {
                pedido: {
                    select: { titulo: true, codigo: true }
                },
                _count: {
                    select: {
                        cotacao_fornecedores: true,
                        propostas: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        // Adapt to match expected structure if needed
        return data.map(item => ({
            ...item,
            fornecedores: [{ count: item._count.cotacao_fornecedores }],
            propostas: [{ count: item._count.propostas }]
        }));
    },

    async getCotacoesByPedidoId(pedidoId: string) {
        const data = await prisma.cotacoes.findMany({
            where: { pedido_id: pedidoId },
            include: {
                _count: {
                    select: {
                        cotacao_fornecedores: true,
                        propostas: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        return data.map(item => ({
            ...item,
            fornecedores: [{ count: item._count.cotacao_fornecedores }],
            propostas: [{ count: item._count.propostas }]
        })) as unknown as (Cotacao & { fornecedores: { count: number }[], propostas: { count: number }[] })[];
    },

    async getCotacaoById(id: string) {
        const data = await prisma.cotacoes.findUnique({
            where: { id },
            include: {
                itens_cotacao: true,
                cotacao_fornecedores: {
                    include: {
                        fornecedor: true
                    }
                },
                propostas: {
                    include: {
                        fornecedor: true,
                        itens_proposta: true
                    }
                }
            }
        });

        // Adapt back to the expected key names if they differ from Prisma conventional naming
        if (!data) return null;

        return {
            ...data,
            itens: data.itens_cotacao,
            convidados: data.cotacao_fornecedores,
            propostas: data.propostas.map(p => ({
                ...p,
                itens: p.itens_proposta
            }))
        };
    },

    async createCotacao(cotacao: Omit<Cotacao, 'id' | 'created_at'>, itensPedido: ItemPedidoCompra[]) {
        const { pedido_id, ...cotacaoData } = cotacao;

        const data = await prisma.cotacoes.create({
            data: {
                ...(cotacaoData as any),
                pedido: pedido_id ? { connect: { id: pedido_id } } : undefined,
                itens_cotacao: {
                    create: itensPedido.map(item => ({
                        item_pedido_id: item.id,
                        descricao: item.descricao,
                        quantidade: item.quantidade as any,
                        unidade: item.unidade
                    }))
                }
            }
        });

        if (pedido_id) {
            await prisma.pedidos_compra.update({
                where: { id: pedido_id },
                data: { status: 'EM_COTACAO' }
            });
        }

        return data;
    },

    async addFornecedorCotacao(cotacaoId: string, fornecedorId: string) {
        await prisma.cotacao_fornecedores.create({
            data: {
                cotacao_id: cotacaoId,
                fornecedor_id: fornecedorId
            }
        });
    },

    // --- PROPOSTAS ---
    async registrarProposta(
        cotacaoId: string,
        fornecedorId: string,
        valorTotal: number,
        itens: { item_cotacao_id: string, preco_unitario: number, quantity: number }[]
    ) {
        const data = await prisma.propostas.create({
            data: {
                cotacao_id: cotacaoId,
                fornecedor_id: fornecedorId,
                valor_total: valorTotal as any,
                itens_proposta: {
                    create: itens.map(item => ({
                        item_cotacao_id: item.item_cotacao_id,
                        preco_unitario: item.preco_unitario as any,
                        quantidade_ofertada: item.quantity as any,
                        valor_total_item: (item.preco_unitario * item.quantity) as any
                    }))
                }
            },
            include: {
                itens_proposta: true
            }
        });

        return data;
    },

    async marcarVencedora(propostaId: string) {
        await prisma.propostas.update({
            where: { id: propostaId },
            data: { is_vencedora: true }
        });
    }
};
