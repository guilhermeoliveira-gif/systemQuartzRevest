
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { MateriaPrima } from '../types';

const CATEGORIAS = ['Aditivo', 'Cimento', 'Embalagem', 'Pigmentos', 'Insumos'] as const;

const MPCadastro: React.FC = () => {
  const [materias, setMaterias] = useState<MateriaPrima[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MateriaPrima>>({
    nome: '',
    unidade_medida: '',
    custo_unitario: 0,
    minimo_seguranca: 0,
    quantidade_atual: 0,
    categoria: 'Insumos'
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

  const handleEdit = (mp: MateriaPrima) => {
    setEditingId(mp.id);
    setFormData({
      nome: mp.nome,
      unidade_medida: mp.unidade_medida,
      custo_unitario: mp.custo_unitario,
      minimo_seguranca: mp.minimo_seguranca,
      quantidade_atual: mp.quantidade_atual,
      categoria: mp.categoria
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.nome) return;

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('materia_prima')
          .update({
            nome: formData.nome,
            unidade_medida: formData.unidade_medida || 'un',
            custo_unitario: Number(formData.custo_unitario) || 0,
            minimo_seguranca: Number(formData.minimo_seguranca) || 0,
            quantidade_atual: Number(formData.quantidade_atual) || 0,
            categoria: formData.categoria
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from('materia_prima').insert({
          nome: formData.nome,
          unidade_medida: formData.unidade_medida || 'un',
          quantidade_atual: Number(formData.quantidade_atual) || 0,
          custo_unitario: Number(formData.custo_unitario) || 0,
          minimo_seguranca: Number(formData.minimo_seguranca) || 0,
          categoria: formData.categoria || 'Insumos',
          organization_id: '1'
        });

        if (error) throw error;
      }

      setIsDialogOpen(false);
      setEditingId(null);
      setEditingId(null);
      setFormData({ nome: '', unidade_medida: '', custo_unitario: 0, minimo_seguranca: 0, quantidade_atual: 0, categoria: 'Insumos' });
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

      {/* Responsive Layout */}
      <div className="bg-white border border-neutral-700 rounded-xl overflow-hidden shadow-sm">
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
          <>
            {/* Desktop Table (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-neutral-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Unidade</th>
                    <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Custo Unitário</th>
                    <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Min. Segurança</th>
                    <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Categoria</th>
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
                      <td className="px-6 py-4 text-sm text-neutral-600 bg-blue-50/50 font-medium">{mp.categoria}</td>
                      <td className="px-6 py-4 text-sm font-bold text-neutral-900">{mp.quantidade_atual}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(mp)} className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
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
            </div>

            {/* Mobile Cards (Visible only on Mobile) */}
            <div className="md:hidden grid gap-4 p-4 bg-slate-50">
              {materias.map((mp) => (
                <div key={mp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{mp.nome}</h3>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block font-mono">
                        UN: {mp.unidade_medida}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${mp.quantidade_atual < (mp.minimo_seguranca || 0) ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-green-100 text-green-700'}`}>
                      {mp.quantidade_atual}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Custo Unit.</span>
                      <span className="font-medium text-slate-900">R$ {mp.custo_unitario?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Mínimo</span>
                      <span className="font-medium text-slate-900">{mp.minimo_seguranca || 0}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleEdit(mp)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 font-bold rounded-lg text-sm hover:bg-blue-100 transition-colors"
                    >
                      <Edit2 size={16} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(mp.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-700 font-bold rounded-lg text-sm hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dialog / Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsDialogOpen(false)}></div>
          <div className="relative bg-white border border-neutral-700 w-full max-w-lg rounded-xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-6">{editingId ? 'Editar' : 'Cadastrar'} Matéria-Prima</h2>
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

              <div>
                <label className="block text-sm font-medium mb-1">Categoria <span className="text-red-500">*</span></label>
                <select
                  className="w-full px-4 py-2 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  value={formData.categoria}
                  onChange={e => setFormData({ ...formData, categoria: e.target.value as any })}
                  required
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 500"
                    className="w-full px-4 py-2 border border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                    value={formData.quantidade_atual}
                    onChange={e => setFormData({ ...formData, quantidade_atual: parseFloat(e.target.value) })}
                  />
                </div>
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
