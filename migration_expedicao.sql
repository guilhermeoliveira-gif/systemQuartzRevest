-- Tabela de Cargas (Expedição)
CREATE TABLE IF NOT EXISTS expedicao_carga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_carga SERIAL, -- Número sequencial fácil visualização
    motorista TEXT NOT NULL,
    veiculo TEXT NOT NULL,
    data_saida DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'FECHADA', 'CANCELADA')),
    peso_total DECIMAL(10,2) DEFAULT 0,
    paletes_total DECIMAL(10,2) DEFAULT 0,
    observacao TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Relacionamento Carga <-> Pedidos
CREATE TABLE IF NOT EXISTS expedicao_carga_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carga_id UUID REFERENCES expedicao_carga(id) ON DELETE CASCADE,
    pedido_id UUID REFERENCES vendas_pedido(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(carga_id, pedido_id) -- Impede mesmo pedido duplicado na carga
);

-- Adicionar coluna de controle na tabela de pedidos (para facilitar filtros)
ALTER TABLE vendas_pedido 
ADD COLUMN IF NOT EXISTS carga_id UUID REFERENCES expedicao_carga(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE expedicao_carga ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedicao_carga_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total a cargas para autenticados" ON expedicao_carga
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total a itens de carga para autenticados" ON expedicao_carga_pedido
FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE TRIGGER update_expedicao_carga_modtime
    BEFORE UPDATE ON expedicao_carga
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
