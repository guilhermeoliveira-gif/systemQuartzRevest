/**
 * Tipos TypeScript para PCP (Planejamento e Controle de Produção)
 * 
 * Substitui os `any` types usados no módulo PCP
 */

export interface ProximaProducao {
    id: string;
    plano_id: string;
    produto_acabado_id: string;
    nome_produto_acabado: string;
    quantidade: number;
    data_prevista: string;
    status: 'PENDENTE' | 'EM_PRODUCAO' | 'CONCLUIDA' | 'CANCELADA';
    prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
    observacoes?: string;
    created_at: string;
    updated_at?: string;
}

export interface PlanoProducao {
    id: string;
    nome: string;
    descricao?: string;
    data_inicio: string;
    data_fim: string;
    status: 'ATIVO' | 'PAUSADO' | 'CONCLUIDO' | 'CANCELADO';
    organization_id: string;
    created_at: string;
    updated_at?: string;

    // Joins opcionais
    itens?: ProximaProducao[];
}

export interface HistoricoProducao {
    id: string;
    produto_acabado_id: string;
    nome_produto_acabado: string;
    quantidade_produzida: number;
    data_inicio: string;
    data_fim: string;
    responsavel_id?: string;
    responsavel_nome?: string;
    observacoes?: string;
    custo_total?: number;
    organization_id: string;
    created_at: string;
}

export interface ItemProducao {
    id: string;
    nome: string;
    categoria: 'PECA' | 'PRODUTO' | 'COMPONENTE';
    quantidade_disponivel?: number;
    unidade_medida?: string;
}

/**
 * Tipos para Projetos
 */
export interface ProjetoStats {
    total: number;
    ativos: number;
    concluidos: number;
    atrasados: number;
    emAndamento: number;
    porStatus: Record<string, number>;
    porPrioridade: Record<string, number>;
}

export interface TarefaStats {
    total: number;
    pendentes: number;
    emAndamento: number;
    concluidas: number;
    atrasadas: number;
    porStatus: Record<string, number>;
    porPrioridade: Record<string, number>;
}

/**
 * Tipos para Notificações
 */
export interface NotificacaoMetadata {
    tipo?: string;
    origem?: string;
    link?: string;
    [key: string]: any;
}

/**
 * Tipos para Busca
 */
export interface ResultadoBusca {
    id: string;
    tipo: 'projeto' | 'tarefa' | 'nc' | 'plano_acao' | 'maquina' | 'veiculo';
    titulo: string;
    descricao?: string;
    link: string;
    metadata?: Record<string, any>;
}

/**
 * Tipos para Testes
 */
export interface EnvCheck {
    VITE_SUPABASE_URL: boolean;
    VITE_SUPABASE_ANON_KEY: boolean;
    [key: string]: boolean;
}

export interface DbCheck {
    connected: boolean;
    error?: string;
    tableCount?: number;
    [key: string]: any;
}

/**
 * Tipos para Forms
 */
export interface FormErrors {
    [key: string]: string;
}

export interface FormState<T> {
    data: T;
    errors: FormErrors;
    isSubmitting: boolean;
    isValid: boolean;
}

/**
 * Tipos Utilitários
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<T | null>;

/**
 * Tipos para Paginação
 */
export interface PaginationParams {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
