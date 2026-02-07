
export type StatusPlanoProducao = 'Pendente' | 'Em Andamento' | 'Concluído';
export type StatusItemProducao = 'Aguardando' | 'Produzindo' | 'Finalizado' | 'Cancelado';

export interface PlanoProducao {
    id: string;
    org_id: string;
    data_planejamento: string;
    status: StatusPlanoProducao;
    created_at?: string;
    updated_at?: string;
    itens?: ItemPlanoProducao[];
}

export interface ItemPlanoProducao {
    id: string;
    id_plano_producao: string;
    id_produto_acabado: string;
    nome_produto_acabado: string;
    qtd_misturas_planejadas: number;
    qtd_produzida: number;
    status: StatusItemProducao;
    ordem: number;
    created_at?: string;
    updated_at?: string;
}

export interface RegistroProducao {
    id: string;
    org_id: string;
    id_item_plano_producao: string;
    id_operador: string;
    nome_operador: string;
    data_hora_inicio: string;
    contador1_inicio: number;
    contador2_inicio: number;
    data_hora_fim?: string;
    contador1_fim?: number;
    contador2_fim?: number;
    qtd_realizada?: number;
    created_at?: string;
}
