export type UrgenciaPedido = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
export type StatusPedido = 'RASCUNHO' | 'PENDENTE' | 'EM_APROVACAO' | 'APROVADO' | 'REJEITADO' | 'EM_COTACAO' | 'CONCLUIDO' | 'CANCELADO';
export type StatusCotacao = 'RASCUNHO' | 'ABERTA' | 'ANALISE' | 'FECHADA' | 'CONCLUIDA';
export type StatusFornecedor = 'ATIVO' | 'INATIVO';

export interface Fornecedor {
    id: string;
    nome: string;
    nome_fantasia?: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    categoria?: string;
    status: StatusFornecedor;
    created_at?: string;
}

export interface PedidoCompra {
    id: string;
    titulo: string;
    codigo?: string;
    urgencia: UrgenciaPedido;
    departamento: string;
    workflow_tipo?: string;
    data_entrega_desejada?: string;
    descricao?: string;
    justificativa_negocio?: string;
    status: StatusPedido;
    solicitante_id?: string;
    aprovador_id?: string;
    data_aprovacao?: string;
    created_at?: string;
    itens?: ItemPedidoCompra[];
}

export interface ItemPedidoCompra {
    id: string;
    pedido_id: string;
    descricao: string;
    quantidade: number;
    unidade: string;
    preco_estimado?: number;
    especificacao_tecnica?: string;
    requisitos_tecnicos?: string;
}

export interface Cotacao {
    id: string;
    pedido_id?: string;
    titulo: string;
    descricao?: string;
    data_abertura?: string;
    prazo_resposta?: string;
    status: StatusCotacao;
    responsavel_id?: string;
    created_at?: string;
    itens?: ItemCotacao[];
    fornecedores?: CotacaoFornecedor[];
    propostas?: PropostaCotacao[];
}

export interface ItemCotacao {
    id: string;
    cotacao_id: string;
    item_pedido_id?: string;
    descricao: string;
    quantidade: number;
    unidade?: string;
}

export interface CotacaoFornecedor {
    id: string;
    cotacao_id: string;
    fornecedor_id: string;
    status: string;
    fornecedor?: Fornecedor;
}

export interface PropostaCotacao {
    id: string;
    cotacao_id: string;
    fornecedor_id: string;
    cotacao_fornecedor_id?: string;
    valor_total?: number;
    prazo_entrega_dias?: number;
    validade_proposta?: string;
    observacoes?: string;
    anexo_url?: string;
    is_vencedora: boolean;
    created_at?: string;
    fornecedor?: Fornecedor;
    itens?: ItemProposta[];
}

export interface ItemProposta {
    id: string;
    proposta_id: string;
    item_cotacao_id: string;
    preco_unitario: number;
    quantidade_ofertada?: number;
    valor_total_item?: number;
    marca_modelo?: string;
    observacao?: string;
    is_vencedor: boolean;
}
