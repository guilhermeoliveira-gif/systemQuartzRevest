import { prisma } from '../lib/prisma';
import { VendaCliente, VendaPedido, VendaItem } from '../types_vendas';
import { EstoquePA } from '../types_estoque';

export const vendasService = {
    // --- CLIENTES ---
    async getClientes() {
        return await prisma.vendas_cliente.findMany({
            orderBy: { nome: 'asc' }
        }) as unknown as VendaCliente[];
    },

    async getClienteById(id: string) {
        return await prisma.vendas_cliente.findUnique({
            where: { id }
        }) as unknown as VendaCliente[];
    },

    async criarCliente(cliente: Omit<VendaCliente, 'id' | 'created_at'>) {
        return await prisma.vendas_cliente.create({
            data: cliente as any
        });
    },

    // --- PRODUTOS (Integração Estoque PA) ---
    async buscarProdutos(query: string) {
        const data = await prisma.produto_acabado.findMany({
            where: {
                nome: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                nome: true,
                unidade_medida: true
            },
            take: 20
        });

        return data.map((p: any) => ({
            id: p.id,
            descricao: p.nome,
            codigo: p.id.split('-')[0],
            unidade: p.unidade_medida
        })) as unknown as EstoquePA[];
    },

    // --- PEDIDOS ---
    async getPedidos() {
        return await prisma.vendas_pedido.findMany({
            include: {
                cliente: {
                    select: { nome: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    },

    async getPedidoById(id: string) {
        const pedido = await prisma.vendas_pedido.findUnique({
            where: { id },
            include: {
                cliente: true,
                itens: {
                    include: {
                        produto: {
                            select: { nome: true, unidade_medida: true }
                        }
                    }
                }
            }
        });

        return pedido;
    },

    async criarPedido(pedido: Partial<VendaPedido>, itens: Partial<VendaItem>[]) {
        const novoPedido = await prisma.vendas_pedido.create({
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
