export type UserRole = 'Gerente' | 'Operador';

export interface MateriaPrima {
  id: string;
  nome: string;
  unidade_medida: string;
  quantidade_atual: number; // DEPRECATED - Use estoque_atual
  custo_unitario: number; // Custo Médio Ponderado
  minimo_seguranca?: number; // DEPRECATED - Use estoque_minimo
  estoque_minimo?: number; // NOVO - Quantidade mínima antes de gerar alerta
  categoria: 'Aditivo' | 'Cimento' | 'Embalagem' | 'Pigmentos' | 'Insumos'; // NOVO - Categoria obrigatória
  estoque_atual?: number; // NOVO - Quantidade atual (atualizado via movimentações)
  alerta_ativo?: boolean; // NOVO - Se TRUE, gera alertas quando estoque < mínimo
  organization_id: string;
  created_at?: string;
}

export interface ProdutoAcabado {
  id: string;
  nome: string;
  unidade_medida: string;
  quantidade_atual: number; // DEPRECATED - Use estoque_atual
  custo_producao_estimado: number;
  estoque_minimo?: number; // NOVO
  estoque_atual?: number; // NOVO
  alerta_ativo?: boolean; // NOVO
  organization_id: string;
  created_at?: string;
}

export interface MecanicaInsumo {
  id: string;
  nome: string;
  categoria: 'PECA' | 'INSUMO';
  quantidade_atual: number;
  unidade_medida: string;
  minimo_seguranca: number;
  localizacao?: string;
  custo_unitario?: number;
  sub_categoria?: string;
  maquina_uso?: string;
  maquina_ids?: string[];
  created_at?: string;
}

export interface MovimentoPeca {
  id: string;
  peca_id: string;
  tipo: 'ENTRADA' | 'SAIDA';
  quantidade: number;
  data_movimento: string;
  motivo_maquina?: string; // Onde foi usada ou motivo da retirada
  maquina_id?: string;
  usuario_id: string;
  nome_retirante?: string; // NOVO: Nome de quem retirou a peça
  foto_url?: string; // NOVO: URL da foto da evidência
  peca?: { nome: string; unidade_medida: string };
}

export interface Formula {
  id: string;
  produto_acabado_id: string;
  nome_formula?: string;
  itens: FormulaItem[]; // Alterado para incluir itens diretamente para simplicidade
  created_at?: string;
}

export interface FormulaItem {
  id: string;
  formula_id?: string; // Opcional se aninhado
  materia_prima_id: string;
  quantidade_necessaria: number; // Qtd de MP para produzir 1 un de PA
}

export interface EntradaMateriaPrima {
  id: string;
  materia_prima_id: string;
  quantidade: number;
  custo_total_nota?: number; // Para calcular custo médio
  data_entrada: string;
  fornecedor: string;
  nota_fiscal: string;
  usuario_id: string;
  observacoes?: string;
  estornado?: boolean; // Flag para anular entrada
}

export interface ProducaoRegistro {
  id: string;
  produto_acabado_id: string;
  quantidade_produzida: number;
  data_producao: string;
  desvio_status: 'OK' | 'MODERADO' | 'ALTO';
  usuario_id: string;
  estornado?: boolean;
}

export interface Alerta {
  id: string;
  tipo_alerta: string;
  mensagem: string;
  data_alerta: string;
  status: string;
}

export interface HistoricoConferencia {
  id: string;
  tipo_item: string;
  item_id: string;
  item_nome: string;
  quantidade_anterior: number;
  quantidade_nova: number;
  diferenca: number;
  usuario_id?: string;
  usuario_nome?: string;
  created_at?: string;
}

export interface HistoricoEntrada {
  id: string;
  materia_prima_id: string;
  item_nome: string;
  quantidade_entrada: number;
  custo_total_nota?: number;
  nf?: string;
  fornecedor?: string;
  usuario_id?: string;
  usuario_nome?: string;
  created_at?: string;
}
