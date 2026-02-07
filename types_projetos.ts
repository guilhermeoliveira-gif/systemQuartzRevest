// Types para Módulo de Gestão de Projetos

export type StatusProjeto = 'PLANEJAMENTO' | 'EM_ANDAMENTO' | 'PAUSADO' | 'CONCLUIDO' | 'CANCELADO';
export type StatusTarefa = 'PENDENTE' | 'EM_ANDAMENTO' | 'BLOQUEADA' | 'CONCLUIDA' | 'CANCELADA';
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface Projeto {
    id: string;
    nome: string;
    descricao?: string;
    responsavel_id?: string;
    data_inicio: string;
    data_fim_prevista: string;
    data_fim_real?: string;
    status: StatusProjeto;
    prioridade: Prioridade;
    progresso: number;
    orcamento?: number;
    custo_real?: number;
    observacoes?: string;
    created_at: string;
    updated_at?: string;

    // Joins opcionais
    responsavel?: {
        id: string;
        nome: string;
        email: string;
    };
    tarefas?: TarefaProjeto[];
}

export interface TarefaProjeto {
    id: string;
    projeto_id: string;
    titulo: string;
    descricao?: string;
    responsavel_id?: string;
    data_inicio?: string;
    data_fim_prevista: string;
    data_fim_real?: string;
    status: StatusTarefa;
    prioridade: Prioridade;
    progresso: number;
    horas_estimadas?: number;
    horas_realizadas?: number;
    dependencias?: string[];
    tags?: string[];
    observacoes?: string;
    created_at: string;
    updated_at?: string;

    // Joins opcionais
    responsavel?: {
        id: string;
        nome: string;
        email: string;
    };
    projeto?: Projeto;
}

export interface ComentarioProjeto {
    id: string;
    projeto_id?: string;
    tarefa_id?: string;
    usuario_id: string;
    comentario: string;
    created_at: string;

    usuario?: {
        id: string;
        nome: string;
        email: string;
    };
}

export interface AnexoProjeto {
    id: string;
    projeto_id?: string;
    tarefa_id?: string;
    nome_arquivo: string;
    url_arquivo: string;
    tipo_arquivo?: string;
    tamanho_bytes?: number;
    usuario_id: string;
    created_at: string;

    usuario?: {
        id: string;
        nome: string;
        email: string;
    };
}
