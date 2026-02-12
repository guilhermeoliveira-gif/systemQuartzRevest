
import { prisma } from '../lib/prisma';
import { MateriaPrima, MecanicaInsumo, EntradaMateriaPrima, ProdutoAcabado, ProducaoRegistro, MovimentoPeca } from '../types';
import { logger } from '../utils/logger';

class EstoqueService {
    private static instance: EstoqueService;

    private constructor() { }

    public static getInstance(): EstoqueService {
        if (!EstoqueService.instance) {
            EstoqueService.instance = new EstoqueService();
        }
        return EstoqueService.instance;
    }

    // --- Materia Prima ---
    public async getMateriasPrimas(): Promise<MateriaPrima[]> {
        const data = await prisma.materia_prima.findMany({
            orderBy: { nome: 'asc' }
        });
        return data as unknown as MateriaPrima[];
    }

    // Helper para atualizar estoque e custo médio
    public async updateMateriaPrimaStock(id: string, quantityToAdd: number, costTotal?: number): Promise<void> {
        // 1. Buscar item atual
        const item = await prisma.materia_prima.findUnique({
            where: { id }
        });

        if (!item) {
            const error = new Error('Item not found');
            logger.error(`Erro ao buscar matéria-prima ${id}`, error);
            throw error;
        }

        let novoCustoUnitario = Number(item.custo_unitario);
        const novaQuantidade = Number(item.quantidade_atual) + quantityToAdd;

        // 2. Calcular Custo Médio (se for entrada positiva e tiver valor)
        if (quantityToAdd > 0 && costTotal && costTotal > 0) {
            const valorAtual = Number(item.quantidade_atual) * Number(item.custo_unitario);
            const novoValorTotal = valorAtual + costTotal;
            if (novaQuantidade > 0) {
                novoCustoUnitario = novoValorTotal / novaQuantidade;
            }
        }

        // 3. Persistir
        await prisma.materia_prima.update({
            where: { id },
            data: {
                quantidade_atual: novaQuantidade as any,
                custo_unitario: novoCustoUnitario as any
            }
        });
    }

    // --- Entrada Materia Prima ---
    public async addEntrada(entrada: Omit<EntradaMateriaPrima, 'id' | 'data_entrada' | 'estornado'>, usuarioNome?: string): Promise<void> {
        // 1. Inserir Registro de Entrada
        const data = await prisma.entrada_materia_prima.create({
            data: {
                ...(entrada as any),
                estornado: false
            }
        });

        // 2. Buscar nome da MP para o histórico
        const mp = await prisma.materia_prima.findUnique({
            where: { id: entrada.materia_prima_id },
            select: { nome: true }
        });

        // 3. Registrar no novo Histórico de Entrada (Audit)
        await this.registrarHistoricoEntrada({
            materia_prima_id: entrada.materia_prima_id,
            item_nome: mp?.nome || 'Desconhecido',
            quantidade_entrada: entrada.quantidade as any,
            custo_total_nota: entrada.custo_total_nota as any,
            nf: entrada.nota_fiscal,
            fornecedor: entrada.fornecedor,
            usuario_id: (entrada.usuario_id === 'CURRENT_USER' || !entrada.usuario_id) ? null : entrada.usuario_id,
            usuario_nome: usuarioNome
        });

        // 4. Atualizar Estoque (Cálculo de Média)
        await this.updateMateriaPrimaStock(entrada.materia_prima_id, entrada.quantidade, entrada.custo_total_nota);
        logger.info(`Entrada de matéria-prima registrada: ${entrada.materia_prima_id} (${entrada.quantidade})`);
    }

    public async estornarEntrada(entradaId: string): Promise<boolean> {
        // 1. Buscar Entrada
        const entry = await prisma.entrada_materia_prima.findUnique({
            where: { id: entradaId }
        });

        if (!entry || entry.estornado) {
            logger.warn(`Tentativa de estorno inválida para entrada ${entradaId}`);
            return false;
        }

        // 2. Marcar como Estornado
        await prisma.entrada_materia_prima.update({
            where: { id: entradaId },
            data: { estornado: true }
        });

        // 3. Reverter Estoque
        await this.updateMateriaPrimaStock(entry.materia_prima_id, -Number(entry.quantidade));
        logger.info(`Entrada ${entradaId} estornada with success`);
        return true;
    }

    public async getHistoricoEntradas(): Promise<EntradaMateriaPrima[]> {
        const data = await prisma.entrada_materia_prima.findMany({
            include: {
                materia_prima_materia_prima_id: {
                    select: {
                        nome: true,
                        unidade_medida: true
                    }
                }
            },
            orderBy: { data_entrada: 'desc' }
        });

        return data as unknown as EntradaMateriaPrima[];
    }

    // --- Produto Acabado ---
    public async getProdutosAcabados(): Promise<ProdutoAcabado[]> {
        const data = await prisma.produto_acabado.findMany({
            orderBy: { nome: 'asc' }
        });
        return data as unknown as ProdutoAcabado[];
    }

    public async addProducao(registro: Omit<ProducaoRegistro, 'id' | 'data_producao'>): Promise<void> {
        // 1. Registrar Produção
        await prisma.producao_registro.create({
            data: registro as any
        });

        // 2. Atualizar Estoque do PA
        const produto = await prisma.produto_acabado.findUnique({
            where: { id: registro.produto_acabado_id }
        });

        if (!produto) {
            logger.error(`Produto acabado ${registro.produto_acabado_id} não encontrado`, null);
            throw new Error('Produto Acabado not found');
        }

        const novaQtd = Number(produto.quantidade_atual) + Number(registro.quantidade_produzida);

        await prisma.produto_acabado.update({
            where: { id: registro.produto_acabado_id },
            data: { quantidade_atual: novaQtd as any }
        });

        // 3. Dedução Automática de Matéria-Prima (Baseada na Fórmula)
        try {
            const formula = await prisma.formula.findFirst({
                where: { produto_acabado_id: registro.produto_acabado_id }
            });

            if (formula) {
                const itensFormula = await prisma.formula_item.findMany({
                    where: { formula_id: formula.id }
                });

                if (itensFormula && itensFormula.length > 0) {
                    for (const item of itensFormula) {
                        const qtdConsumida = Number(item.quantidade) * registro.quantidade_produzida;
                        await this.updateMateriaPrimaStock(item.materia_prima_id, -qtdConsumida);
                    }
                    logger.info(`Dedução de matéria-prima concluída para produção ${registro.produto_acabado_id}`);
                }
            }
        } catch (error) {
            logger.error(`Falha na dedução automática de MP para o produto ${registro.produto_acabado_id}`, error);
        }

        logger.info(`Produção registrada: ${registro.produto_acabado_id} (+${registro.quantidade_produzida})`);
    }

    // --- Peças e Insumos ---
    public async getPecasInsumos(): Promise<MecanicaInsumo[]> {
        const data = await prisma.mecanica_insumo.findMany({
            include: {
                mecanica_insumo_maquina_insumo_id_list: {
                    select: { maquina_id: true }
                }
            },
            orderBy: { nome: 'asc' }
        });

        return data.map((peca: any) => ({
            ...peca,
            maquina_ids: peca.mecanica_insumo_maquina_insumo_id_list?.map((m: any) => m.maquina_id) || []
        })) as unknown as MecanicaInsumo[];
    }

    public async addMovimentoPeca(movimento: Omit<MovimentoPeca, 'id' | 'data_movimento'>): Promise<void> {
        const tipoNormalized = String(movimento.tipo || '').trim().toUpperCase();
        const qtdAjustada = Math.abs(Number(movimento.quantidade || 0));
        const isSaida = tipoNormalized === 'SAIDA';

        logger.info(`Iniciando registro de movimento: ${movimento.peca_id}, Tipo: ${tipoNormalized} (${isSaida ? 'SAIDA' : 'ENTRADA'}), Qtd: ${qtdAjustada}`);

        // 1. Inserir registro
        await prisma.movimento_peca.create({
            data: {
                ...(movimento as any),
                quantidade: qtdAjustada as any,
                tipo: tipoNormalized
            }
        });

        // 2. Buscar saldo atual
        const item = await prisma.mecanica_insumo.findUnique({
            where: { id: movimento.peca_id }
        });

        if (!item) {
            logger.error(`Erro ao buscar saldo: Peça ${movimento.peca_id} não encontrada`, null);
            throw new Error('Item not found');
        }

        // 3. Calcular novo saldo
        const estoqueAtual = Number(item.quantidade_atual || 0);
        const fatorOperacao = isSaida ? -1 : 1;
        const deltaQuantidade = qtdAjustada * fatorOperacao;
        const novaQuantidade = estoqueAtual + deltaQuantidade;

        // 4. Salvar novo saldo
        await prisma.mecanica_insumo.update({
            where: { id: movimento.peca_id },
            data: {
                quantidade_atual: novaQuantidade as any,
                updated_at: new Date()
            }
        });

        logger.info(`Estoque atualizado com sucesso: ${movimento.peca_id} -> ${novaQuantidade}`);
    }

    // CRUD Genérico para Peças
    public async createPeca(peca: Partial<MecanicaInsumo>, maquinaIds: string[]): Promise<void> {
        const { maquina_ids, ...pecaData } = peca as any;

        const newPeca = await prisma.mecanica_insumo.create({
            data: {
                ...(pecaData as any),
                mecanica_insumo_maquina_insumo_id_list: {
                    create: maquinaIds.map(mid => ({
                        maquina_id: mid
                    }))
                }
            }
        });

        logger.info(`Peça criada: ${newPeca.id}`);
    }

    public async updatePeca(id: string, updates: Partial<MecanicaInsumo>, maquinaIds?: string[]): Promise<void> {
        const { maquina_ids, ...updateData } = updates as any;

        await prisma.mecanica_insumo.update({
            where: { id },
            data: {
                ...(updateData as any),
                ...(maquinaIds !== undefined ? {
                    mecanica_insumo_maquina_insumo_id_list: {
                        deleteMany: {},
                        create: maquinaIds.map(mid => ({
                            maquina_id: mid
                        }))
                    }
                } : {})
            }
        });

        logger.info(`Peça atualizada: ${id}`);
    }

    public async deletePeca(id: string): Promise<void> {
        await prisma.mecanica_insumo.delete({
            where: { id }
        });
        logger.info(`Peça excluída: ${id}`);
    }

    // --- Histórico e Auditoria ---

    public async registrarHistoricoConferencia(dados: any): Promise<void> {
        await prisma.historico_conferencia.create({
            data: dados as any
        });
    }

    public async registrarHistoricoEntrada(dados: any): Promise<void> {
        await prisma.historico_entrada.create({
            data: dados as any
        });
    }
}

export const estoqueService = EstoqueService.getInstance();
