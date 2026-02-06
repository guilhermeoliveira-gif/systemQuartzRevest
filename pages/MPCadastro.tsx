
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { MateriaPrima } from '../types';

const MPCadastro: React.FC = () => {
  const [materias, setMaterias] = useState<MateriaPrima[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<MateriaPrima>>({
    nome: '',
    unidade_medida: '',
    custo_unitario: 0,
    minimo_seguranca: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('materia_prima').select('*').order('nome');
    if (data) {
      setMaterias(data);
    }
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.nome) return;

      const { error } = await supabase.from('materia_prima').insert({
        nome: formData.nome,
        unidade_medida: formData.unidade_medida || 'un',
        quantidade_atual: 0,
        custo_unitario: Number(formData.custo_unitario) || 0,
        minimo_seguranca: Number(formData.minimo_seguranca) || 0,
        organization_id: '1'
      });

      if (error) throw error;

      setIsDialogOpen(false);
      setFormData({ nome: '', unidade_medida: '', custo_unitario: 0, minimo_seguranca: 0 });
      loadData();
    } catch (error) {
      console.error('Error saving materia prima:', error);
      alert('Erro ao salvar. Verifique o console.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta matéria-prima?')) {
      await supabase.from('materia_prima').delete().eq('id', id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Gerenciar Matéria-Prima</h1>
          <p className="text-neutral-500">Cadastre e gerencie os insumos de sua produção.</p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nova Matéria-Prima
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-neutral-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <div className="text-center text-gray-500">Carregando dados do servidor...</div>
            </div>
          ) : materias.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p>Nenhuma matéria-prima cadastrada.</p>
              <p>Clique em "Nova Matéria-Prima" para começar.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Unidade</th>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Custo Unitário</th>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Min. Segurança</th>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Qtd. Atual</th>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {materias.map((mp) => (
                  <tr key={mp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900">{mp.nome}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{mp.unidade_medida}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">R$ {mp.custo_unitario?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{mp.minimo_seguranca || 0}</td>
                    <td className="px-6 py-4 text-sm font-bold text-neutral-900">{mp.quantidade_atual}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(mp.id)} className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Dialog / Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsDialogOpen(false)}></div>
          <div className="relative bg-white border border-neutral-700 w-full max-w-lg rounded-xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Cadastrar Matéria-Prima</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome da Matéria-Prima</label>
                <input
                  type="text"
                  placeholder="Ex: Alumínio 5052"
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
                    placeholder="kg, un, L"
                    className="w-full px-4 py-2 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                    value={formData.unidade_medida}
                    onChange={e => setFormData({ ...formData, unidade_medida: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Custo Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                    value={formData.custo_unitario}
                    onChange={e => setFormData({ ...formData, custo_unitario: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estoque Mínimo (Segurança)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 100"
                  className="w-full px-4 py-2 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  value={formData.minimo_seguranca}
                  onChange={e => setFormData({ ...formData, minimo_seguranca: parseFloat(e.target.value) })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 text-neutral-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MPCadastro;
