export type TipoVeiculo = 'CARRO' | 'MOTO' | 'TOCO' | 'TRUCK' | 'CAVALO' | 'CARRETA' | 'OUTRO';
export type StatusVeiculo = 'ATIVO' | 'MANUTENÇÃO' | 'INATIVO';
export type TipoManutencao = 'PREVENTIVA' | 'CORRETIVA' | 'PREDITIVA';
export type TipoServico = 'LAVAGEM' | 'CALIBRAGEM' | 'PNEUS' | 'OUTROS';

export interface Veiculo {
    id: string;
    placa: string;
    marca?: string;
    modelo: string;
    tipo: TipoVeiculo;
    ano?: number;
    km_atual: number;
    status: StatusVeiculo;
    created_at?: string;
}

export interface Abastecimento {
    id: string;
    veiculo_id: string;
    data: string;
    km: number;
    litros: number;
    valor_total: number;
    posto?: string;
    media_km_l?: number;
    usuario_id?: string;
    motorista_id?: string;
    created_at?: string;
}

export interface Manutencao {
    id: string;
    veiculo_id: string;
    data: string;
    km: number;
    tipo_manutencao: TipoManutencao;
    descricao: string;
    custo: number;
    oficina?: string;
    usuario_id?: string;
    created_at?: string;
}

export interface Servico {
    id: string;
    veiculo_id: string;
    data: string;
    km: number;
    tipo_servico: TipoServico;
    custo: number;
    observacoes?: string;
    usuario_id?: string;
    created_at?: string;
}
