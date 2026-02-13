
export type StatusMaquina = 'Operacional' | 'Em Manutenção' | 'Parada';
export type TipoManutencao = 'Preventiva' | 'Corretiva' | 'Preditiva';
export type StatusOS = 'Aberta' | 'Em Execução' | 'Concluída' | 'Cancelada';
export type PrioridadeOS = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type TipoOS = 'Corretiva' | 'Preventiva' | 'Preditiva' | 'Problema' | 'Tarefa' | 'Manutencao Preventiva';

export interface ManutencaoPlano {
    id: string;
    organization_id?: string;
    nome: string;
    descricao?: string;
    ativo: boolean;
    created_at?: string;
}

export interface ManutencaoPlanoItem {
    id: string;
    plano_id: string;
    tarefa: string;
    descricao_detalhada?: string;
    periodicidade_horas?: number;
    periodicidade_dias?: number;
    pecas_sugeridas?: any[];
}

export interface MaquinaPlanoVinculo {
    id: string;
    maquina_id: string;
    plano_id: string;
    plano?: ManutencaoPlano;
    ultima_execucao_data?: string;
    ultima_execucao_horas?: number;
    status_vencimento: string;
}


export interface Maquina {
    id: string;
    org_id?: string;
    nome: string;
    modelo?: string;
    serie?: string;
    data_aquisicao?: string;
    horas_uso_total: number;
    intervalo_manutencao_horas: number;
    ultima_manutencao_horas: number;
    ultima_manutencao_data?: string;
    quantidade_manutencoes: number;
    status: StatusMaquina;
    tipo?: string;
    created_at?: string;
    updated_at?: string;
}

export interface MaquinaItem {
    id: string;
    maquina_id: string;
    nome: string;
    descricao?: string;
    periodicidade_horas?: number;
    periodicidade_dias?: number;
    ultima_revisao_data?: string;
    ultima_revisao_horas?: number;
    status: 'OK' | 'Revisão Pendente' | 'Crítico';
    peca_estoque_id?: string;
    peca_estoque?: {
        nome: string;
        unidade_medida: string;
        quantidade_atual: number;
    };
}

export interface Aprendizado {
    id: string;
    maquina_id: string;
    os_id?: string;
    titulo: string;
    descricao: string;
    tags?: string[];
    created_at?: string;
    created_by?: string;
}

export interface PecaUtilizada {
    peca_id: string;
    nome: string;
    quantidade: number;
    custo_unitario: number;
}

export interface OrdemServico {
    id: string;
    org_id?: string;
    maquina_id?: string; // Agora opcional
    maquina?: Maquina;
    tipo: TipoManutencao;
    tipo_os?: TipoOS; // Novo campo
    nc_id?: string; // Relacionamento com Problema
    tarefa_id?: string; // Relacionamento com Tarefa
    status: StatusOS;
    prioridade: PrioridadeOS;
    descricao: string;
    causa_problema?: string;
    solucao_aplicada?: string;
    tecnico_responsavel?: string;
    data_abertura: string;
    data_inicio?: string;
    data_conclusao?: string;
    custo_total: number;
    horas_maquina_na_os?: number;
    pecas_utilizadas: PecaUtilizada[];
    tipo_correcao?: 'Definitiva' | 'Paleativa'; // Novo campo de fechamento
    descricao_fechamento?: string; // Novo campo de fechamento
    created_at?: string;
    updated_at?: string;
}
