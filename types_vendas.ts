export interface VendaCliente {
    id: string;
    nome: string;
    cnpj_cpf?: string;
    contato?: string;
    endereco?: string;
    email?: string;
    telefone?: string;
    created_at?: string;
}

export interface VendaItem {
    id: string;
    pedido_id: string;
    produto_id: string;
    produto?: {
        id: string;
        codigo: string;
        descricao: string;
        unidade: string;
    }; // Join com estoque_pa
    quantidade: number;
    valor_unitario: number;
    valor_total?: number;
}

export type StatusPedido = 'ORCAMENTO' | 'APROVADO' | 'EM_SEPARACAO' | 'ENTREGUE' | 'CANCELADO';

export interface VendaPedido {
    id: string;
    numero_pedido: number;
    cliente_id: string;
    cliente?: VendaCliente;
    data_emissao: string;
    data_previsao_entrega?: string;
    status: StatusPedido;
    observacao?: string;
    valor_total: number;
    itens?: VendaItem[];
    user_id?: string;
    created_at?: string;
    updated_at?: string;
}
