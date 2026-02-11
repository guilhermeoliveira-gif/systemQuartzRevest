

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Box } from 'lucide-react';
import { ProdutoAcabado } from '../types';
import { estoqueService } from '../services/estoqueService';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';

const PACadastro: React.FC = () => {
  const toast = useToast();
  const [produtos, setProdutos] = useState<ProdutoAcabado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ProdutoAcabado>>({
    nome: '',
    unidade_medida: '',
    custo_producao_estimado: 0
  });

  useEffect(() => {
    loadProdutos();
  }, []);

  const loadProdutos = async () => {
    try {
      setIsLoading(true);
      const data = await estoqueService.getProdutosAcabados();
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro', 'Falha ao carregar produtos acabados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('produto_acabado')
        .insert({
          nome: formData.nome,
          unidade_medida: formData.unidade_medida,
          custo_producao_estimado: Number(formData.custo_producao_estimado) || 0,
          quantidade_atual: 0,
          estoque_atual: 0,
          estoque_minimo: 0,
          organization_id: '1'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Sucesso', '✅ Produto cadastrado com sucesso!');
      setIsDialogOpen(false);
      setFormData({ nome: '', unidade_medida: '', custo_producao_estimado: 0 });
      loadProdutos(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro', 'Falha ao cadastrar produto.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Gerenciar Produto Acabado</h1>
          <p className="text-neutral-500">Controle o estoque de seus produtos finais prontos para entrega.</p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Novo Produto Acabado
        </button>
      </div>

      <div className="bg-white border border-neutral-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-12 w-full bg-gray-100 animate-pulse rounded"></div>)}
            </div>
          ) : produtos.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              <Box size={48} className="mx-auto mb-4 opacity-20" />
              <p>Nenhum produto cadastrado.</p>
              <button onClick={() => setIsDialogOpen(true)} className="text-blue-600 hover:underline">Clique aqui para começar.</button>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Unidade</th>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Custo Estimado</th>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Qtd. Atual</th>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {produtos.map((pa) => (
                  <tr key={pa.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900">{pa.nome}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{pa.unidade_medida}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">R$ {pa.custo_producao_estimado.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-neutral-900">{pa.quantidade_atual}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={16} /></button>
                        <button className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsDialogOpen(false)}></div>
          <div className="relative bg-white border border-neutral-700 w-full max-w-lg rounded-xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-6 text-blue-600">Cadastrar Produto Acabado</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Produto</label>
                <input
                  type="text"
                  placeholder="Ex: Motor Elétrico 5HP"
                  className="w-full px-4 py-2 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Unidade de Medida</label>
                  <input
                    type="text"
                    placeholder="unidade, caixa"
                    className="w-full px-4 py-2 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                    value={formData.unidade_medida}
                    onChange={e => setFormData({ ...formData, unidade_medida: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Custo Produção (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                    value={formData.custo_producao_estimado}
                    onChange={e => setFormData({ ...formData, custo_producao_estimado: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-neutral-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PACadastro;
