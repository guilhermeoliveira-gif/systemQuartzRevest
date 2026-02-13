import { supabase } from './supabaseClient';
import { Veiculo, Abastecimento, Manutencao, Servico, TipoVeiculo, StatusVeiculo } from '../types_frota';

export const frotaService = {
    // --- Veículos ---

    async getVeiculos(): Promise<Veiculo[]> {
        const { data, error } = await supabase
            .from('frota_veiculos')
            .select('*')
            .order('status', { ascending: true }) // Ativos primeiro
            .order('placa', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getVeiculoById(id: string): Promise<Veiculo | null> {
        const { data, error } = await supabase
            .from('frota_veiculos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async createVeiculo(veiculo: Omit<Veiculo, 'id' | 'created_at'>): Promise<Veiculo> {
        const { data, error } = await supabase
            .from('frota_veiculos')
            .insert([veiculo])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateVeiculo(id: string, updates: Partial<Veiculo>): Promise<void> {
        const { error } = await supabase
            .from('frota_veiculos')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteVeiculo(id: string): Promise<void> {
        const { error } = await supabase
            .from('frota_veiculos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Abastecimentos ---

    async getAbastecimentos(veiculoId: string): Promise<Abastecimento[]> {
        const { data, error } = await supabase
            .from('frota_abastecimentos')
            .select('*')
            .eq('veiculo_id', veiculoId)
            .order('data', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getAllAbastecimentos(): Promise<(Abastecimento & { veiculo?: Veiculo })[]> {
        const { data, error } = await supabase
            .from('frota_abastecimentos')
            .select('*, veiculo:frota_veiculos(*)')
            .order('data', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async registrarAbastecimento(abastecimento: Omit<Abastecimento, 'id' | 'created_at' | 'media_km_l'>): Promise<Abastecimento> {
        // 1. Buscar último abastecimento para cálculo de média
        const { data: lastSupply } = await supabase
            .from('frota_abastecimentos')
            .select('km, data')
            .eq('veiculo_id', abastecimento.veiculo_id)
            .lt('km', abastecimento.km) // Garante que é anterior ao atual
            .order('km', { ascending: false })
            .limit(1)
            .single();

        let media_km_l = 0;

        if (lastSupply) {
            const kmRodados = abastecimento.km - lastSupply.km;
            if (kmRodados > 0 && abastecimento.litros > 0) {
                media_km_l = parseFloat((kmRodados / abastecimento.litros).toFixed(2));
            }
        }

        // 2. Inserir abastecimento
        const { data, error } = await supabase
            .from('frota_abastecimentos')
            .insert([{ ...abastecimento, media_km_l }])
            .select()
            .single();

        if (error) throw error;

        // 3. Atualizar KM do veículo se for maior
        await this.atualizarKmVeiculo(abastecimento.veiculo_id, abastecimento.km);

        return data;
    },

    // --- Manutenções ---

    async getManutencoes(veiculoId: string): Promise<Manutencao[]> {
        const { data, error } = await supabase
            .from('frota_manutencoes')
            .select('*')
            .eq('veiculo_id', veiculoId)
            .order('data', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getAllManutencoes(): Promise<(Manutencao & { veiculo?: Veiculo })[]> {
        const { data, error } = await supabase
            .from('frota_manutencoes')
            .select('*, veiculo:frota_veiculos(*)')
            .order('data', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async registrarManutencao(manutencao: Omit<Manutencao, 'id' | 'created_at'>): Promise<Manutencao> {
        const { data, error } = await supabase
            .from('frota_manutencoes')
            .insert([manutencao])
            .select()
            .single();

        if (error) throw error;

        await this.atualizarKmVeiculo(manutencao.veiculo_id, manutencao.km);

        return data;
    },

    // --- Serviços (Lavagem, Calibragem) ---

    async getServicos(veiculoId: string): Promise<Servico[]> {
        const { data, error } = await supabase
            .from('frota_servicos')
            .select('*')
            .eq('veiculo_id', veiculoId)
            .order('data', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async registrarServico(servico: Omit<Servico, 'id' | 'created_at'>): Promise<Servico> {
        const { data, error } = await supabase
            .from('frota_servicos')
            .insert([servico])
            .select()
            .single();

        if (error) throw error;

        await this.atualizarKmVeiculo(servico.veiculo_id, servico.km);

        return data;
    },

    // --- Helper Privado ---

    async atualizarKmVeiculo(veiculoId: string, novoKm: number): Promise<void> {
        // Verifica KM atual para não reduzir (em caso de lançamentos retroativos)
        const { data: veiculo } = await supabase
            .from('frota_veiculos')
            .select('km_atual')
            .eq('id', veiculoId)
            .single();

        if (veiculo && novoKm > veiculo.km_atual) {
            await supabase
                .from('frota_veiculos')
                .update({ km_atual: novoKm })
                .eq('id', veiculoId);
        }
    },

    async getMotoristas() {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome, perfil!inner(nome)')
            .eq('perfil.nome', 'Motorista')
            .eq('ativo', true);

        if (error) throw error;
        return data.map((u: any) => ({ id: u.id, nome: u.nome }));
    }
};
