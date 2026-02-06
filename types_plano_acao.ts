
export interface Tarefa {
    id: string;
    descricao: string;
    responsavel_id: string;
    data_inicio: string;
    data_termino: string;
    concluida: boolean;
}

export interface PlanoAcao {
    id: string;
    nc_id?: string; // ID da Não Conformidade vinculada (opcional)
    titulo: string;
    origem: 'RNC' | 'MANUAL'; // Se veio de uma RNC ou foi criado avulso

    // 5W2H Methodology
    what: string;       // O que será feito? (Ação)
    why: string;        // Por que será feito? (Motivo/Justificativa)
    where: string;      // Onde será feito? (Local)
    when: string;       // Quando será feito? (Prazo)
    who: string;        // Quem fará? (Responsável)
    how: string;        // Como será feito? (Método/Procedimento)
    how_much: string;   // Quanto custará? (Custo estimado ou Zero)

    tarefas?: Tarefa[]; // Checklist de tarefas do plano

    status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
    created_at: string;
    updated_at: string;
}
