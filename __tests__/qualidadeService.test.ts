/**
 * Unit Tests for qualidadeService
 * 
 * Testing Strategy:
 * - Unit tests for service layer methods
 * - Mock Supabase client
 * - AAA Pattern (Arrange, Act, Assert)
 * - Focus on business logic and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { qualidadeService } from '../services/qualidadeService';
import { supabase } from '../supabaseClient';

// Mock Supabase client
vi.mock('../supabaseClient', () => ({
    supabase: {
        from: vi.fn()
    }
}));

describe('qualidadeService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getNaoConformidades', () => {
        it('should fetch all non-conformities successfully', async () => {
            // Arrange
            const mockData = [
                {
                    id: '1',
                    titulo: 'Test RNC',
                    descricao: 'Test description',
                    tipo: 'PRODUTO',
                    status: 'EM_ANALISE',
                    severidade: 'ALTA',
                    created_at: new Date().toISOString()
                }
            ];

            const mockSelect = vi.fn().mockResolvedValue({
                data: mockData,
                error: null
            });

            const mockOrder = vi.fn().mockReturnValue({
                select: mockSelect
            });

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: mockOrder
                })
            });

            // Act
            const result = await qualidadeService.getNaoConformidades();

            // Assert
            expect(result).toEqual(mockData);
            expect(supabase.from).toHaveBeenCalledWith('nao_conformidade');
        });

        it('should throw error when fetch fails', async () => {
            // Arrange
            const mockError = { message: 'Database error' };

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        select: vi.fn().mockResolvedValue({
                            data: null,
                            error: mockError
                        })
                    })
                })
            });

            // Act & Assert
            await expect(qualidadeService.getNaoConformidades()).rejects.toThrow('Erro ao buscar não conformidades');
        });
    });

    describe('createNaoConformidade', () => {
        it('should create a new non-conformity successfully', async () => {
            // Arrange
            const newNC = {
                titulo: 'Nova RNC',
                descricao: 'Descrição teste',
                tipo: 'PROCESSO' as const,
                origem: 'Linha 1',
                data_ocorrencia: '2026-02-06',
                status: 'EM_ANALISE' as const,
                severidade: 'MEDIA' as const,
                responsavel_id: 'user-123',
                acao_contencao: 'Parada imediata'
            };

            const mockCreated = { ...newNC, id: 'new-id', created_at: new Date().toISOString() };

            (supabase.from as any).mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: mockCreated,
                            error: null
                        })
                    })
                })
            });

            // Act
            const result = await qualidadeService.createNaoConformidade(newNC);

            // Assert
            expect(result).toEqual(mockCreated);
            expect(supabase.from).toHaveBeenCalledWith('nao_conformidade');
        });

        it('should throw error when creation fails', async () => {
            // Arrange
            const newNC = {
                titulo: 'Nova RNC',
                descricao: 'Descrição teste',
                tipo: 'PROCESSO' as const,
                origem: 'Linha 1',
                data_ocorrencia: '2026-02-06',
                status: 'EM_ANALISE' as const,
                severidade: 'MEDIA' as const,
                responsavel_id: 'user-123'
            };

            const mockError = { message: 'Insert failed' };

            (supabase.from as any).mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: null,
                            error: mockError
                        })
                    })
                })
            });

            // Act & Assert
            await expect(qualidadeService.createNaoConformidade(newNC)).rejects.toThrow('Erro ao criar não conformidade');
        });
    });

    describe('saveAnaliseCausa', () => {
        it('should save 5 Whys analysis successfully', async () => {
            // Arrange
            const ncId = 'nc-123';
            const analise = {
                pq1: 'Por que 1',
                pq2: 'Por que 2',
                pq3: 'Por que 3',
                pq4: 'Por que 4',
                pq5: 'Por que 5',
                causa_raiz: 'Causa raiz identificada'
            };

            (supabase.from as any).mockReturnValue({
                upsert: vi.fn().mockResolvedValue({
                    data: { ...analise, nao_conformidade_id: ncId },
                    error: null
                })
            });

            // Act
            await qualidadeService.saveAnaliseCausa(ncId, analise);

            // Assert
            expect(supabase.from).toHaveBeenCalledWith('analise_causa');
        });
    });

    describe('createPlanoAcao', () => {
        it('should create action plan with 5W2H successfully', async () => {
            // Arrange
            const plano = {
                titulo: 'Plano de Ação Teste',
                what: 'O que fazer',
                why: 'Por que fazer',
                where_loc: 'Onde fazer',
                when_date: '2026-02-15',
                who: 'Responsável',
                how: 'Como fazer',
                how_much: 'R$ 1000',
                status_acao: 'PENDENTE' as const
            };

            const mockCreated = { ...plano, id: 'plano-123', created_at: new Date().toISOString() };

            (supabase.from as any).mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: mockCreated,
                            error: null
                        })
                    })
                })
            });

            // Act
            const result = await qualidadeService.createPlanoAcao(plano);

            // Assert
            expect(result).toEqual(mockCreated);
            expect(result.what).toBe('O que fazer');
            expect(result.status_acao).toBe('PENDENTE');
        });
    });

    describe('createTarefa', () => {
        it('should create task successfully', async () => {
            // Arrange
            const tarefa = {
                plano_acao_id: 'plano-123',
                descricao: 'Tarefa teste',
                responsavel: 'João Silva',
                prazo: '2026-02-20',
                status: 'PENDENTE' as const,
                observacoes: 'Observação teste'
            };

            const mockCreated = { ...tarefa, id: 'task-123', created_at: new Date().toISOString() };

            (supabase.from as any).mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: mockCreated,
                            error: null
                        })
                    })
                })
            });

            // Act
            const result = await qualidadeService.createTarefa(tarefa);

            // Assert
            expect(result).toEqual(mockCreated);
            expect(result.status).toBe('PENDENTE');
        });
    });

    describe('updateTarefa', () => {
        it('should update task status successfully', async () => {
            // Arrange
            const taskId = 'task-123';
            const updates = { status: 'CONCLUIDA' as const };

            (supabase.from as any).mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                        data: { id: taskId, ...updates },
                        error: null
                    })
                })
            });

            // Act
            await qualidadeService.updateTarefa(taskId, updates);

            // Assert
            expect(supabase.from).toHaveBeenCalledWith('tarefa');
        });
    });

    describe('deleteTarefa', () => {
        it('should delete task successfully', async () => {
            // Arrange
            const taskId = 'task-123';

            (supabase.from as any).mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                        error: null
                    })
                })
            });

            // Act
            await qualidadeService.deleteTarefa(taskId);

            // Assert
            expect(supabase.from).toHaveBeenCalledWith('tarefa');
        });
    });
});
