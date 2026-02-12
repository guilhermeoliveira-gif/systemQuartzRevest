-- Migração para Módulo de Checklist

-- 1. Tabela de Modelos de Checklist
CREATE TABLE checklist_modelo (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    area text, -- Área ou Setor (ex: Produção, Frotas)
    descricao text,
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Tabela de Itens do Modelo
CREATE TABLE checklist_item_modelo (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    modelo_id uuid REFERENCES checklist_modelo(id) ON DELETE CASCADE,
    texto text NOT NULL, -- Pergunta ou Instrução
    tipo text DEFAULT 'CONFORME_NAO_CONFORME', -- 'CONFORME_NAO_CONFORME', 'NUMERICO', 'TEXTO', 'FOTO'
    ordem integer DEFAULT 0,
    obrigatorio boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 3. Tabela de Agendamentos / Instâncias de Checklist
CREATE TABLE checklist_agendamento (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    modelo_id uuid REFERENCES checklist_modelo(id),
    status text DEFAULT 'PENDENTE', -- 'PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'ATRASADO', 'CANCELADO'
    data_agendada date NOT NULL,
    responsavel_id uuid REFERENCES auth.users(id), -- Quem deve executar
    
    -- Polimorfismo para Entidade (Máquina, Veículo, Área)
    entidade_id uuid, 
    tipo_entidade text, -- 'MAQUINA', 'VEICULO', 'AREA'
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Tabela de Execução (Registro da realização)
CREATE TABLE checklist_execucao (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agendamento_id uuid REFERENCES checklist_agendamento(id),
    data_inicio timestamptz DEFAULT now(),
    data_fim timestamptz,
    executor_id uuid REFERENCES auth.users(id), -- Quem executou de fato
    status text DEFAULT 'EM_ANDAMENTO', -- 'EM_ANDAMENTO', 'FINALIZADO'
    observacoes_gerais text,
    created_at timestamptz DEFAULT now()
);

-- 5. Tabela de Respostas
CREATE TABLE checklist_resposta (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    execucao_id uuid REFERENCES checklist_execucao(id) ON DELETE CASCADE,
    item_modelo_id uuid REFERENCES checklist_item_modelo(id),
    
    conforme boolean, -- Para itens Conforme/Não Conforme
    valor_numerico numeric, -- Para itens Numéricos
    valor_texto text, -- Para itens Texto/Obs
    foto_url text, -- Evidência fotográfica
    
    observacao text, -- Observação específica do item
    nao_conformidade_id uuid, -- Link para a NC gerada (se houver)
    
    created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_checklist_agendamento_data ON checklist_agendamento(data_agendada);
CREATE INDEX idx_checklist_agendamento_status ON checklist_agendamento(status);
CREATE INDEX idx_checklist_resposta_execucao ON checklist_resposta(execucao_id);

-- Policies (RLS) - Exemplo Básico (Permitir tudo para autenticados por enquanto)
ALTER TABLE checklist_modelo ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_item_modelo ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_agendamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_execucao ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_resposta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total checklist_modelo" ON checklist_modelo FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total checklist_item_modelo" ON checklist_item_modelo FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total checklist_agendamento" ON checklist_agendamento FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total checklist_execucao" ON checklist_execucao FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total checklist_resposta" ON checklist_resposta FOR ALL USING (auth.role() = 'authenticated');
