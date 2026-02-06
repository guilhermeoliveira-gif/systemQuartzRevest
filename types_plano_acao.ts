
export interface Tarefa {
    id: string;
    plano_acao_id: string;
    descricao: string;
    responsavel: string;
    prazo: string;
    status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';
    observacoes?: string;
    created_at: string;
    updated_at?: string;
}

export interface PlanoAcao {
    id: string;
    nao_conformidade_id?: string; // ID da Não Conformidade vinculada
    titulo: string;

    // 5W2H Methodology
    what: string;       // O que será feito? (Ação)
    why: string;        // Por que será feito? (Motivo/Justificativa)
    where_loc: string;  // Onde será feito? (Local) - renamed to avoid SQL keyword
    when_date: string;  // Quando será feito? (Prazo) - renamed to avoid SQL keyword
    who: string;        // Quem fará? (Responsável)
    how: string;        // Como será feito? (Método/Procedimento)
    how_much?: string;  // Quanto custará? (Custo estimado ou Zero)

    status_acao: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'VERIFICADA';
    created_at: string;
    updated_at?: string;

    // Tarefas podem ser carregadas separadamente
    tarefas?: Tarefa[];
}
