-- Tabela de Pendências de Expedição
CREATE TABLE IF NOT EXISTS expedicao_pendencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES vendas_cliente(id) ON DELETE RESTRICT,
    produto_id UUID REFERENCES produto_acabado(id) ON DELETE RESTRICT,
    quantidade DECIMAL(10,2) NOT NULL,
    data_resolvida TIMESTAMP WITH TIME ZONE, -- NULL = Pendente, Data = Resolvida
    observacao TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE expedicao_pendencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total a pendencias para autenticados" ON expedicao_pendencia
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger de Update
CREATE TRIGGER update_expedicao_pendencia_modtime
    BEFORE UPDATE ON expedicao_pendencia
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
