import { describe, it, expect, vi, beforeEach } from 'vitest';
import { comprasService } from '../services/comprasService';
import { supabase } from '../supabaseClient';
import { PedidoCompra, Cotacao, PropostaCotacao } from '../types_compras';

// Mock Supabase client
vi.mock('../supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
            order: vi.fn().mockReturnThis(),
        })),
    },
}));

describe('comprasService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getPedidos', () => {
        it('should fetch all orders successfully', async () => {
            const mockPedidos: PedidoCompra[] = [
                { id: '1', titulo: 'Pedido 1', status: 'PENDENTE', urgencia: 'ALTA', departamento: 'TI' },
                { id: '2', titulo: 'Pedido 2', status: 'APROVADO', urgencia: 'NORMAL', departamento: 'RH' },
            ];

            // Correctly mock the chain: from -> select -> order -> result
            const mockOrder = vi.fn().mockResolvedValue({ data: mockPedidos, error: null });
            const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
            const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

            (supabase.from as any).mockImplementation(mockFrom);

            const result = await comprasService.getPedidos();

            expect(supabase.from).toHaveBeenCalledWith('pedidos_compra');
            expect(result).toEqual(mockPedidos);
        });

        it('should throw error when fetch fails', async () => {
            const mockError = { message: 'Database error' };

            // Correctly mock the chain for error case
            const mockOrder = vi.fn().mockResolvedValue({ data: null, error: mockError });
            const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
            const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

            (supabase.from as any).mockImplementation(mockFrom);

            await expect(comprasService.getPedidos()).rejects.toEqual(mockError);
        });
    });

    describe('createPedido', () => {
        it('should create a new order and its items successfully', async () => {
            const newPedido = {
                titulo: 'Novo Pedido',
                status: 'PENDENTE',
                urgencia: 'NORMAL',
                departamento: 'Obras'
            };
            const itens = [
                { descricao: 'Item A', quantidade: 10, unidade: 'UN' }
            ];

            const mockCreatedPedido = { ...newPedido, id: 'new-id' };

            // Mock implementation specifically for create flow
            // 1. Insert Pedido
            const mockSingle = vi.fn().mockReturnValue({ data: mockCreatedPedido, error: null });
            const mockSelectPedido = vi.fn().mockReturnValue({ single: mockSingle });
            const mockInsertPedido = vi.fn().mockReturnValue({ select: mockSelectPedido });

            // 2. Insert Items (mock separate call)
            const mockInsertItems = vi.fn().mockReturnValue({ error: null });

            // Setup mock implementation to return different things based on table name
            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'pedidos_compra') {
                    return { insert: mockInsertPedido };
                }
                if (table === 'itens_pedido_compra') {
                    return { insert: mockInsertItems };
                }
                return {};
            });

            const result = await comprasService.createPedido(newPedido as any, itens as any);

            expect(supabase.from).toHaveBeenCalledWith('pedidos_compra');
            expect(supabase.from).toHaveBeenCalledWith('itens_pedido_compra');
            expect(result).toEqual(mockCreatedPedido);
        });
    });

    describe('updateStatusPedido', () => {
        it('should update order status successfully', async () => {
            const pedidoId = '123';
            const newStatus = 'APROVADO';

            const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ error: null }) });
            (supabase.from as any).mockReturnValue({ update: mockUpdate });

            await comprasService.updateStatusPedido(pedidoId, newStatus);

            expect(supabase.from).toHaveBeenCalledWith('pedidos_compra');
            expect(mockUpdate).toHaveBeenCalledWith({ status: newStatus });
        });
    });

    describe('createCotacao', () => {
        it('should create a quotation linked to an order', async () => {
            const cotacaoData = { titulo: 'Cotação 1', pedido_id: '123' };
            const itensPedido = [{ id: 'item1', descricao: 'Item 1', quantidade: 5, unidade: 'UN' }];
            const mockCreatedCotacao = { ...cotacaoData, id: 'cot-1' };

            const mockSingle = vi.fn().mockReturnValue({ data: mockCreatedCotacao, error: null });
            const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
            const mockInsertCotacao = vi.fn().mockReturnValue({ select: mockSelect });

            const mockInsertItensCotacao = vi.fn().mockReturnValue({ error: null });
            const mockUpdatePedido = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({}) });

            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'cotacoes') return { insert: mockInsertCotacao };
                if (table === 'itens_cotacao') return { insert: mockInsertItensCotacao };
                if (table === 'pedidos_compra') return { update: mockUpdatePedido };
                return {};
            });

            const result = await comprasService.createCotacao(cotacaoData as any, itensPedido as any);

            expect(result).toEqual(mockCreatedCotacao);
            expect(supabase.from).toHaveBeenCalledWith('itens_cotacao');
            // Check if status update was called
            expect(supabase.from).toHaveBeenCalledWith('pedidos_compra');
        });
    });
});
