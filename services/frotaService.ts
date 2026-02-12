import { prisma } from '../lib/prisma';
import { Veiculo, Abastecimento, Manutencao, Servico, TipoVeiculo, StatusVeiculo } from '../types_frota';

export const frotaService = {
    // --- Veículos ---

    async getVeiculos(): Promise<Veiculo[]> {
        return await prisma.frota_veiculos.findMany({
            orderBy: [
                { status: 'asc' },
                { placa: 'asc' }
            ]
        }) as unknown as Veiculo[];
    },

    async getVeiculoById(id: string): Promise<Veiculo | null> {
        return await prisma.frota_veiculos.findUnique({
            where: { id }
        }) as unknown as Veiculo;
    },

    async createVeiculo(veiculo: Omit<Veiculo, 'id' | 'created_at'>): Promise<Veiculo> {
        return await prisma.frota_veiculos.create({
            data: veiculo as any
        }) as unknown as Veiculo;
    },

    async updateVeiculo(id: string, updates: Partial<Veiculo>): Promise<void> {
        await prisma.frota_veiculos.update({
            where: { id },
            data: updates as any
        });
    },

    async deleteVeiculo(id: string): Promise<void> {
        await prisma.frota_veiculos.delete({
            where: { id }
        });
    },

    // --- Abastecimentos ---

    async getAbastecimentos(veiculoId: string): Promise<Abastecimento[]> {
        return await prisma.frota_abastecimentos.findMany({
            where: { veiculo_id: veiculoId },
            orderBy: { data: 'desc' }
        }) as unknown as Abastecimento[];
    },

    async getAllAbastecimentos(): Promise<(Abastecimento & { veiculo?: Veiculo })[]> {
        const data = await prisma.frota_abastecimentos.findMany({
            include: {
                veiculo: true
            },
            orderBy: { data: 'desc' }
        });
        return data as unknown as (Abastecimento & { veiculo?: Veiculo })[];
    },

    async registrarAbastecimento(abastecimento: Omit<Abastecimento, 'id' | 'created_at' | 'media_km_l'>): Promise<Abastecimento> {
        // 1. Buscar último abastecimento para cálculo de média
        const lastSupply = await prisma.frota_abastecimentos.findFirst({
            where: {
                veiculo_id: abastecimento.veiculo_id,
                km: { lt: abastecimento.km }
            },
            select: { km: true, data: true },
            orderBy: { km: 'desc' }
        });

        let media_km_l = 0;

        if (lastSupply) {
            const kmRodados = abastecimento.km - Number(lastSupply.km);
            if (kmRodados > 0 && abastecimento.litros > 0) {
                media_km_l = parseFloat((kmRodados / abastecimento.litros).toFixed(2));
            }
        }

        // 2. Inserir abastecimento
        const data = await prisma.frota_abastecimentos.create({
            data: { ...abastecimento as any, media_km_l }
        });

        // 3. Atualizar KM do veículo se for maior
        await this.atualizarKmVeiculo(abastecimento.veiculo_id, abastecimento.km);

        return data as unknown as Abastecimento;
    },

    // --- Manutenções ---

    async getManutencoes(veiculoId: string): Promise<Manutencao[]> {
        return await prisma.frota_manutencoes.findMany({
            where: { veiculo_id: veiculoId },
            orderBy: { data: 'desc' }
        }) as unknown as Manutencao[];
    },

    async getAllManutencoes(): Promise<(Manutencao & { veiculo?: Veiculo })[]> {
        const data = await prisma.frota_manutencoes.findMany({
            include: {
                veiculo: true
            },
            orderBy: { data: 'desc' }
        });
        return data as unknown as (Manutencao & { veiculo?: Veiculo })[];
    },

    async registrarManutencao(manutencao: Omit<Manutencao, 'id' | 'created_at'>): Promise<Manutencao> {
        const data = await prisma.frota_manutencoes.create({
            data: manutencao as any
        });

        await this.atualizarKmVeiculo(manutencao.veiculo_id, manutencao.km);

        return data as unknown as Manutencao;
    },

    // --- Serviços (Lavagem, Calibragem) ---

    async getServicos(veiculoId: string): Promise<Servico[]> {
        return await prisma.frota_servicos.findMany({
            where: { veiculo_id: veiculoId },
            orderBy: { data: 'desc' }
        }) as unknown as Servico[];
    },

    async registrarServico(servico: Omit<Servico, 'id' | 'created_at'>): Promise<Servico> {
        const data = await prisma.frota_servicos.create({
            data: servico as any
        });

        await this.atualizarKmVeiculo(servico.veiculo_id, servico.km);

        return data as unknown as Servico;
    },

    // --- Helper Privado ---

    async atualizarKmVeiculo(veiculoId: string, novoKm: number): Promise<void> {
        const veiculo = await prisma.frota_veiculos.findUnique({
            where: { id: veiculoId },
            select: { km_atual: true }
        });

        if (veiculo && novoKm > Number(veiculo.km_atual)) {
            await prisma.frota_veiculos.update({
                where: { id: veiculoId },
                data: { km_atual: novoKm }
            });
        }
    }
};
