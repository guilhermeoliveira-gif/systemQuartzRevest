export interface EstoquePA {
    id: string;
    codigo?: string; // Adicionado para compatibilidade com Vendas
    nome: string;
    descricao?: string; // Alias para nome
    unidade_medida: string;
    unidade?: string; // Alias para unidade_medida
    estoque_atual: number;
    custo_producao_estimado: number;
    estoque_minimo?: number;
    alerta_ativo?: boolean;
    organization_id?: string;
    created_at?: string;
}

export interface EstoqueMP {
    id: string;
    nome: string;
    unidade_medida: string;
    estoque_atual: number;
    custo_unitario: number;
    estoque_minimo?: number;
    categoria: string;
    alerta_ativo?: boolean;
    organization_id?: string;
    created_at?: string;
}
