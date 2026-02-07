// Types para Sistema de Notificações

export type TipoNotificacao =
    | 'TAREFA_ATRIBUIDA'
    | 'TAREFA_ATRASADA'
    | 'PRAZO_PROXIMO'
    | 'NC_CRIADA'
    | 'PROJETO_ATUALIZADO'
    | 'ESTOQUE_MINIMO'
    | 'SISTEMA';

export type PrioridadeNotificacao = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';

export interface Notificacao {
    id: string;
    usuario_id: string;
    tipo: TipoNotificacao;
    titulo: string;
    mensagem: string;
    link?: string;
    lida: boolean;
    data_leitura?: string;
    prioridade: PrioridadeNotificacao;
    metadata?: Record<string, any>;
    created_at: string;
}

export interface PreferenciaNotificacao {
    id: string;
    usuario_id: string;
    email_tarefa_atribuida: boolean;
    email_tarefa_atrasada: boolean;
    email_prazo_proximo: boolean;
    email_estoque_minimo: boolean;
    push_tarefa_atribuida: boolean;
    push_tarefa_atrasada: boolean;
    push_prazo_proximo: boolean;
    horario_resumo_diario: string;
    enviar_resumo_diario: boolean;
    created_at: string;
    updated_at?: string;
}

export type OrigemTarefa = 'PLANO_ACAO' | 'PROJETO';

export interface TarefaUnificada {
    id: string;
    origem: OrigemTarefa;
    titulo: string;
    descricao?: string;
    responsavel_id?: string;
    prazo: string;
    status: string;
    prioridade: string;
    contexto?: string;
    link: string;
    created_at: string;

    // Join opcional
    responsavel?: {
        id: string;
        nome: string;
        email: string;
    };
}
