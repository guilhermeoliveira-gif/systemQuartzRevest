
-- 1. Materia Prima
CREATE TABLE IF NOT EXISTS materia_prima (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  unidade_medida VARCHAR(20) NOT NULL,
  quantidade_atual NUMERIC(10, 2) DEFAULT 0,
  custo_unitario NUMERIC(10, 2) DEFAULT 0, -- Custo Medio
  minimo_seguranca NUMERIC(10, 2) DEFAULT 0,
  organization_id VARCHAR(50) DEFAULT '1', -- Multitenant placeholder
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Produto Acabado
CREATE TABLE IF NOT EXISTS produto_acabado (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  unidade_medida VARCHAR(20) NOT NULL,
  quantidade_atual NUMERIC(10, 2) DEFAULT 0,
  custo_producao_estimado NUMERIC(10, 2) DEFAULT 0,
  organization_id VARCHAR(50) DEFAULT '1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insumos e Pecas
CREATE TABLE IF NOT EXISTS mecanica_insumo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(50) NOT NULL, -- 'PECA' or 'INSUMO'
  unidade_medida VARCHAR(20) DEFAULT 'un',
  quantidade_atual NUMERIC(10, 2) DEFAULT 0,
  minimo_seguranca NUMERIC(10, 2) DEFAULT 0,
  localizacao VARCHAR(100),
  custo_unitario NUMERIC(10, 2) DEFAULT 0,
  organization_id VARCHAR(50) DEFAULT '1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Historico Entrada MP
CREATE TABLE IF NOT EXISTS entrada_materia_prima (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  materia_prima_id UUID REFERENCES materia_prima(id),
  quantidade NUMERIC(10, 2) NOT NULL,
  custo_total_nota NUMERIC(10, 2) DEFAULT 0,
  data_entrada TIMESTAMPTZ DEFAULT NOW(),
  fornecedor VARCHAR(255),
  nota_fiscal VARCHAR(100),
  usuario_id VARCHAR(100),
  observacoes TEXT,
  estornado BOOLEAN DEFAULT FALSE
);

-- 5. Historico Producao
CREATE TABLE IF NOT EXISTS producao_registro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_acabado_id UUID REFERENCES produto_acabado(id),
  quantidade_produzida NUMERIC(10, 2) NOT NULL,
  data_producao TIMESTAMPTZ DEFAULT NOW(),
  desvio_status VARCHAR(50) DEFAULT 'OK',
  usuario_id VARCHAR(100),
  estornado BOOLEAN DEFAULT FALSE
);

-- 6. Movimentacao Pecas (Historico)
CREATE TABLE IF NOT EXISTS movimento_peca (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  peca_id UUID REFERENCES mecanica_insumo(id),
  tipo VARCHAR(20) NOT NULL, -- 'ENTRADA' or 'SAIDA'
  quantidade NUMERIC(10, 2) NOT NULL,
  data_movimento TIMESTAMPTZ DEFAULT NOW(),
  motivo_maquina VARCHAR(255),
  usuario_id VARCHAR(100)
);

-- Enable Row Level Security (RLS) - Optional for MVP but good practice
ALTER TABLE materia_prima ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_acabado ENABLE ROW LEVEL SECURITY;
ALTER TABLE mecanica_insumo ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrada_materia_prima ENABLE ROW LEVEL SECURITY;
ALTER TABLE producao_registro ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimento_peca ENABLE ROW LEVEL SECURITY;

-- Policy (Open for now, lock down later)
CREATE POLICY "Public Access" ON materia_prima FOR ALL USING (true);
CREATE POLICY "Public Access" ON produto_acabado FOR ALL USING (true);
CREATE POLICY "Public Access" ON mecanica_insumo FOR ALL USING (true);
CREATE POLICY "Public Access" ON entrada_materia_prima FOR ALL USING (true);
CREATE POLICY "Public Access" ON producao_registro FOR ALL USING (true);
CREATE POLICY "Public Access" ON movimento_peca FOR ALL USING (true);
