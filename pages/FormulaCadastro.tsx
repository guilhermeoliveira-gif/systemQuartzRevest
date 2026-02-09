
import React, { useState, useEffect } from 'react';
import { Plus, Info, Trash2 } from 'lucide-react';
import { Formula, FormulaItem, MateriaPrima, ProdutoAcabado } from '../types';
import { store } from '../services/store';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';

const FormulaCadastro: React.FC = () => {
  const toast = useToast();
  const [formulas, setFormulas] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<ProdutoAcabado[]>([]);
  const [materias, setMaterias] = useState<MateriaPrima[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedPA, setSelectedPA] = useState('');
  const [items, setItems] = useState<{ mpId: string; qty: number }[]>([]);
  const [currentMP, setCurrentMP] = useState('');
  const [currentQty, setCurrentQty] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [produtosData, materiasData, formulasData] = await Promise.all([
        store.getProdutosAcabados(),
        store.getMateriasPrimas(),
        supabase.from('formula').select(`
          *,
          produto_acabado:produto_acabado(nome),
          formula_item(
            quantidade,
            materia_prima:materia_prima(nome, unidade_medida)
          )
        `).order('created_at', { ascending: false })
      ]);

      setProdutos(produtosData);
      setMaterias(materiasData);

      // Formatar fórmulas para exibição
      if (formulasData.data) {
        const formulasFormatadas = formulasData.data.map((f: any) => ({
          id: f.id,
          produto_acabado_nome: f.produto_acabado?.nome || 'N/A',
          created_at: new Date(f.created_at).toLocaleDateString('pt-BR'),
          items_resumo: f.formula_item?.map((item: any) =>
            `${item.materia_prima?.nome} (${item.quantidade}${item.materia_prima?.unidade_medida})`
          ).join(', ') || 'Sem itens'
        }));
        setFormulas(formulasFormatadas);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro', 'Falha ao carregar fórmulas.');
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    if (currentMP && currentQty > 0) {
      setItems([...items, { mpId: currentMP, qty: currentQty }]);
      setCurrentMP('');
      setCurrentQty(0);
    }
  };

  const removeListItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSaveFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPA || items.length === 0) {
      toast.error('Erro', 'Selecione um produto e adicione pelo menos uma matéria-prima.');
      return;
    }

    try {
      // 1. Criar fórmula
      const { data: formula, error: formulaError } = await supabase
        .from('formula')
        .insert({
          produto_acabado_id: selectedPA,
          organization_id: '1'
        })
        .select()
        .single();

      if (formulaError) throw formulaError;

      // 2. Criar itens da fórmula
      const formulaItems = items.map(item => ({
        formula_id: formula.id,
        materia_prima_id: item.mpId,
        quantidade: item.qty
      }));

      const { error: itemsError } = await supabase
        .from('formula_item')
        .insert(formulaItems);

      if (itemsError) throw itemsError;

      toast.success('Sucesso', '✅ Fórmula cadastrada com sucesso!');
      setIsDialogOpen(false);
      setSelectedPA('');
      setItems([]);
      loadData(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao salvar fórmula:', error);
      toast.error('Erro', 'Falha ao cadastrar fórmula.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Gerenciar Fórmulas</h1>
          <p className="text-neutral-500">Defina a composição de seus produtos acabados.</p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nova Fórmula
        </button>
      </div>

      <div className="bg-white border border-neutral-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Produto Acabado</th>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Itens da Fórmula (Resumo)</th>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Data de Criação</th>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {formulas.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">{f.produto_acabado_nome}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    <div className="flex items-center gap-2 group cursor-help">
                      <span className="truncate max-w-xs">{f.items_resumo}</span>
                      <Info size={14} className="text-blue-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{f.created_at}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-red-500 hover:text-red-700 p-2">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsDialogOpen(false)}></div>
          <div className="relative bg-white border border-neutral-700 w-full max-w-2xl rounded-xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Nova Fórmula de Produto</h2>
            <form onSubmit={handleSaveFormula} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Produto Acabado</label>
                <select
                  value={selectedPA}
                  onChange={e => setSelectedPA(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-700 rounded-lg outline-none"
                  required
                >
                  <option value="">Selecione um produto...</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-neutral-200">
                <h3 className="text-sm font-bold uppercase text-neutral-500 mb-4">Adicionar Matérias-Primas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    className="col-span-1 md:col-span-1 px-3 py-2 border border-neutral-700 rounded-lg"
                    value={currentMP}
                    onChange={e => setCurrentMP(e.target.value)}
                  >
                    <option value="">MP...</option>
                    {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                  <input
                    type="number"
                    placeholder="Qtd"
                    className="px-3 py-2 border border-neutral-700 rounded-lg"
                    value={currentQty || ''}
                    onChange={e => setCurrentQty(parseFloat(e.target.value))}
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="mt-4 bg-white border border-neutral-200 rounded-lg max-h-40 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">MP</th>
                        <th className="p-2 text-left">Qtd</th>
                        <th className="p-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx} className="border-t border-neutral-100">
                          <td className="p-2">{materias.find(m => m.id === it.mpId)?.nome}</td>
                          <td className="p-2">{it.qty} {materias.find(m => m.id === it.mpId)?.unidade_medida}</td>
                          <td className="p-2 text-right">
                            <button type="button" onClick={() => removeListItem(idx)} className="text-red-500 hover:underline">Remover</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 text-neutral-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedPA || items.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Salvar Fórmula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulaCadastro;
