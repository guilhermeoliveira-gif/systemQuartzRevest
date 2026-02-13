
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { estoqueService } from '../services/estoqueService';
import { supabase } from '../services/supabaseClient';

// Mock Supabase client from services folder
vi.mock('../services/supabaseClient', () => ({
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

describe('estoqueService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getMateriasPrimas', () => {
        it('should fetch all raw materials successfully', async () => {
            const mockData = [
                { id: '1', nome: 'Cimento', quantidade_atual: 100 },
                { id: '2', nome: 'Areia', quantidade_atual: 50 },
            ];

            const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
            const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
            const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

            (supabase.from as any).mockImplementation(mockFrom);

            const result = await estoqueService.getMateriasPrimas();

            expect(supabase.from).toHaveBeenCalledWith('materia_prima');
            expect(result).toEqual(mockData);
        });

        it('should throw error when fetch fails', async () => {
            const mockError = { message: 'Database error' };
            const mockOrder = vi.fn().mockResolvedValue({ data: null, error: mockError });
            const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
            const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

            (supabase.from as any).mockImplementation(mockFrom);

            await expect(estoqueService.getMateriasPrimas()).rejects.toEqual(mockError);
        });
    });

    describe('updateMateriaPrimaStock', () => {
        it('should update stock and weighted average cost successfully', async () => {
            const mpId = '1';
            const quantityToAdd = 100; // Adding 100 units
            const costTotal = 2000; // Total cost 2000 (unit cost 20)

            const currentItem = {
                id: mpId,
                quantidade_atual: 100,
                custo_unitario: 10 // Current value = 1000
            };

            // Mock fetching current item
            const mockSingle = vi.fn().mockResolvedValue({ data: currentItem, error: null });
            const mockSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) });

            // Mock update
            const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'materia_prima') {
                    // We need to return an object that can handle both select and update phases
                    // Or we can simple mock the chain.
                    // Implementation note: The service calls from('materia_prima').select... AND .update...
                    // So we need a mock that returns fresh mocks on each call or handles both.
                    return {
                        select: mockSelect,
                        update: mockUpdate
                    };
                }
                return {};
            });

            await estoqueService.updateMateriaPrimaStock(mpId, quantityToAdd, costTotal);

            // Calculation:
            // Old: 100 * 10 = 1000
            // New: 100 * 20 = 2000 (derived from total cost)
            // Total Qty: 200
            // Total Value: 3000
            // New Avg: 15

            expect(mockUpdate).toHaveBeenCalledWith({
                quantidade_atual: 200,
                custo_unitario: 15
            });
        });
    });

    describe('addEntrada', () => {
        it('should insert entry and update stock', async () => {
            const entrada = {
                materia_prima_id: '1',
                quantidade: 50,
                custo_total_nota: 1000,
                fornecedor: 'Forn A',
                nota_fiscal: 'NF123',
                usuario_id: 'user1'
            };

            // Mock Insert (Entrada)
            const mockInsertEntrada = vi.fn().mockReturnValue({ error: null });
            // Mock Insert (Historico)
            const mockInsertHistorico = vi.fn().mockReturnValue({ error: null });

            // Mock fetching current item for updateMateriaPrimaStock + Name for history
            const currentItem = {
                id: '1',
                nome: 'Cimento',
                quantidade_atual: 0,
                custo_unitario: 0
            };

            const mockSingle = vi.fn().mockResolvedValue({ data: currentItem, error: null });
            const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

            // Mock Update
            const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'entrada_materia_prima') return { insert: mockInsertEntrada };
                if (table === 'historico_entrada') return { insert: mockInsertHistorico };
                if (table === 'materia_prima') return { select: mockSelect, update: mockUpdate };
                return {
                    select: vi.fn().mockReturnThis(),
                    insert: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockReturnThis()
                };
            });

            await estoqueService.addEntrada(entrada);

            expect(mockInsertEntrada).toHaveBeenCalled();
            expect(mockInsertHistorico).toHaveBeenCalled();
            expect(mockUpdate).toHaveBeenCalled();
        });
    });
});
