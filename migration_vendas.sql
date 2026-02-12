-- Criação da tabela de Clientes (Simples)
CREATE TABLE IF NOT EXISTS vendas_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cnpj_cpf TEXT,
    contato TEXT,
    endereco TEXT,
    email TEXT,
    telefone TEXT,
    user_id UUID REFERENCES auth.users(id), -- Quem cadastrou
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS para Clientes
ALTER TABLE vendas_cliente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total a clientes para autenticados" ON vendas_cliente
FOR ALL USING (auth.role() = 'authenticated');

-- Criação da tabela de Pedidos de Venda
CREATE TABLE IF NOT EXISTS vendas_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_pedido SERIAL, -- Número sequencial amigável
    cliente_id UUID REFERENCES vendas_cliente(id) ON DELETE RESTRICT,
    data_emissao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    data_previsao_entrega TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'ORCAMENTO' CHECK (status IN ('ORCAMENTO', 'APROVADO', 'EM_SEPARACAO', 'ENTREGUE', 'CANCELADO')),
    observacao TEXT,
    valor_total DECIMAL(10,2) DEFAULT 0,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS para Pedidos
ALTER TABLE vendas_pedido ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total a pedidos para autenticados" ON vendas_pedido
FOR ALL USING (auth.role() = 'authenticated');

-- Criação da tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS vendas_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES vendas_pedido(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES estoque_pa(id) ON DELETE RESTRICT, -- Integração com Estoque PA
    quantidade DECIMAL(10,2) NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS para Itens
ALTER TABLE vendas_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total a itens para autenticados" ON vendas_item
FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para atualizar data de modificação
CREATE TRIGGER update_vendas_cliente_modtime
    BEFORE UPDATE ON vendas_cliente
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_vendas_pedido_modtime
    BEFORE UPDATE ON vendas_pedido
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
