// Types para Checklist

export type TipoItemChecklist = 'CONFORME_NAO_CONFORME' | 'NUMERICO' | 'TEXTO' | 'FOTO';
export type StatusAgendamento = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO' | 'CANCELADO';
export type TipoEntidade = 'MAQUINA' | 'VEICULO' | 'AREA';

export interface ChecklistModelo {
    id: string;
    nome: string;
    area: string;
    descricao?: string;
    ativo: boolean;
    created_at: string;
    updated_at: string;

    // Join
    itens?: ChecklistItemModelo[];
}

export interface ChecklistItemModelo {
    id: string;
    modelo_id: string;
    texto: string;
    tipo: TipoItemChecklist;
    ordem: number;
    obrigatorio: boolean;
    created_at: string;
}

export interface ChecklistAgendamento {
    id: string;
    modelo_id: string;
    status: StatusAgendamento;
    data_agendada: string;
    responsavel_id: string;
    entidade_id?: string;
    tipo_entidade?: TipoEntidade;
    created_at: string;
    updated_at: string;

    // Joins
    modelo?: ChecklistModelo;
    responsavel?: {
        id: string;
        nome: string;
        email: string;
    };
    entidade_nome?: string; // Campo virtual para exibição
}

export interface ChecklistExecucao {
    id: string;
    agendamento_id: string;
    data_inicio: string;
    data_fim?: string;
    executor_id: string;
    status: 'EM_ANDAMENTO' | 'FINALIZADO';
    observacoes_gerais?: string;
    created_at: string;

    // Joins
    respostas?: ChecklistResposta[];
}

export interface ChecklistResposta {
    id: string;
    execucao_id: string;
    item_modelo_id: string;
    conforme?: boolean;
    valor_numerico?: number;
    valor_texto?: string;
    foto_url?: string;
    observacao?: string;
    nao_conformidade_id?: string;
    created_at: string;
}
