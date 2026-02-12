
-- Tabela de Fórmulas (Cabeçalho)
CREATE TABLE IF NOT EXISTS formula (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    produto_acabado_id UUID NOT NULL REFERENCES produto_acabado(id),
    nome_formula VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    organization_id VARCHAR(255) DEFAULT '1', -- Added for consistency
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by product
CREATE INDEX IF NOT EXISTS idx_formula_produto ON formula(produto_acabado_id);

-- Tabela de Itens da Fórmula (Ingredientes)
CREATE TABLE IF NOT EXISTS formula_item (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    formula_id UUID NOT NULL REFERENCES formula(id) ON DELETE CASCADE,
    materia_prima_id UUID NOT NULL REFERENCES materia_prima(id),
    quantidade_necessaria DECIMAL(10,4) NOT NULL, -- Precisão maior para insumos pequenos
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by formula
CREATE INDEX IF NOT EXISTS idx_formula_item_formula ON formula_item(formula_id);

-- Enable RLS (Row Level Security)
ALTER TABLE formula ENABLE ROW LEVEL SECURITY;
ALTER TABLE formula_item ENABLE ROW LEVEL SECURITY;

-- Create policies (Permissive for authenticated users, consistent with other tables)
DROP POLICY IF EXISTS "Public access to formula" ON formula;
CREATE POLICY "Public access to formula" ON formula FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to formula_item" ON formula_item;
CREATE POLICY "Public access to formula_item" ON formula_item FOR ALL TO authenticated USING (true) WITH CHECK (true);
