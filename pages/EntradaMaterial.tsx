
import React, { useState, useEffect } from 'react';
import { estoqueService } from '../services/estoqueService';
import { MateriaPrima, EntradaMateriaPrima } from '../types';
import { Warehouse, Save, History, FileText, User, RefreshCcw, DollarSign, Package } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import MobileCard from '../components/MobileCard';

const EntradaMaterial: React.FC = () => {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [historico, setHistorico] = useState<EntradaMateriaPrima[]>([]);

  const [form, setForm] = useState({
    materia_prima_id: '',
    quantidade: '',
    valor_total: '', // New field for Weighted Average Cost
    fornecedor: '',
    nota_fiscal: '',
    usuario_id: user?.id || ''
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const mps = await estoqueService.getMateriasPrimas();
      const hist = await estoqueService.getHistoricoEntradas();
      setMateriasPrimas(mps || []);
      setHistorico(hist || []);
      console.log('Dados carregados:', { mps: mps?.length, hist: hist?.length });
    } catch (e) {
      console.error('Error loading data', e);
      toast.error('Erro de Conexão', 'Falha ao carregar dados do estoque.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNewTotal = () => {
    if (!form.materia_prima_id || !form.quantidade) return null;
    const mp = materiasPrimas.find(m => m.id === form.materia_prima_id);
    if (!mp) return null;
    return (Number(mp.quantidade_atual) || 0) + Number(form.quantidade);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.materia_prima_id || !form.quantidade) {
      toast.error('Campos Obrigatórios', 'Por favor, selecione o material e informe a quantidade.');
      return;
    }

    try {
      await estoqueService.addEntrada({
        materia_prima_id: form.materia_prima_id,
        quantidade: Number(form.quantidade),
        custo_total_nota: Number(form.valor_total) || 0,
        fornecedor: form.fornecedor,
        nota_fiscal: form.nota_fiscal,
        usuario_id: user?.id || ''
      }, profile?.nome || user?.email || undefined);

      toast.success('Entrada registrada com sucesso!', 'Estoque e custo médio atualizados.');

      setForm({
        ...form,
        quantidade: '',
        valor_total: '',
        nota_fiscal: '',
        fornecedor: ''
      });
      await loadData();

    } catch (err: any) {
      toast.error('Erro ao registrar entrada', err.message || 'Erro desconhecido');
      console.error(err);
    }
  };

  const handleEstorno = async (id: string) => {
    if (confirm('ATENÇÃO: Deseja realmente ESTORNAR este lançamento? O estoque será revertido.')) {
      try {
        const success = await estoqueService.estornarEntrada(id);
        if (success) {
          toast.success('Sucesso', 'Lançamento estornado com sucesso.');
          await loadData();
        } else {
          toast.error('Erro', 'Não foi possível estornar.');
        }
      } catch (e) {
        toast.error('Erro', 'Erro ao estornar.');
        console.error(e);
      }
    }
  };

  const selectedMp = materiasPrimas.find(m => m.id === form.materia_prima_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Warehouse className="text-blue-600" />
          Entrada de Matéria Prima
        </h1>
        <p className="text-slate-500">Registro de recebimento, custo médio e controle de estoque</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Entry Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-700">
              <Save size={20} className="text-blue-500" />
              Nova Entrada
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-slate-700 ml-1">Material</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      required
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:ring-0 transition-all font-medium appearance-none"
                      value={form.materia_prima_id}
                      onChange={e => setForm({ ...form, materia_prima_id: e.target.value })}
                      disabled={isLoading}
                    >
                      <option value="">{isLoading ? 'Carregando materiais...' : 'Selecione o material...'}</option>
                      {materiasPrimas.map(mp => (
                        <option key={mp.id} value={mp.id}>
                          {mp.nome} ({mp.unidade_medida})
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedMp && (
                    <div className="px-4 py-2 bg-blue-50/50 rounded-lg flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Estoque Atual: <span className="text-slate-900 font-bold">{selectedMp.quantidade_atual} {selectedMp.unidade_medida}</span></span>
                      <span className="text-slate-500 font-medium">Custo Médio: <span className="text-slate-900 font-bold">R$ {Number(selectedMp.custo_unitario || 0).toFixed(2)}</span></span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-lg md:col-span-2 border border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Quantidade</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">#</div>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 transition-all font-bold text-lg"
                          value={form.quantidade}
                          onChange={e => setForm({ ...form, quantidade: e.target.value })}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">
                          {selectedMp ? selectedMp.unidade_medida : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                        <DollarSign size={14} /> Valor Total Nota
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 transition-all font-bold text-lg"
                          placeholder="0.00"
                          value={form.valor_total}
                          onChange={e => setForm({ ...form, valor_total: e.target.value })}
                        />
                      </div>
                      <span className="block text-[10px] text-slate-400 italic font-medium ml-1">Cálculo de custo médio ponderado</span>
                    </div>
                  </div>

                  {/* Live Feedback */}
                  {selectedMp && form.quantidade && (
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Previsão Estoque</span>
                      <span className="font-bold text-slate-700">
                        {selectedMp.quantidade_atual} ➝ <span className="text-green-600">{calculateNewTotal()} {selectedMp.unidade_medida}</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Nota Fiscal</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 transition-all font-medium"
                    placeholder="Ex: 001234"
                    value={form.nota_fiscal}
                    onChange={e => setForm({ ...form, nota_fiscal: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Fornecedor</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 transition-all font-medium"
                    placeholder="Nome do fornecedor"
                    value={form.fornecedor}
                    onChange={e => setForm({ ...form, fornecedor: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={!form.materia_prima_id || !form.quantidade}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Registrar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Updated History Sidebar with Reversal */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full max-h-[600px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <History size={18} className="text-slate-400" />
                Histórico de Entradas
              </h3>
            </div>

            <div className="overflow-y-auto p-4 space-y-4 flex-1">
              {historico.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">Nenhuma entrada registrada ainda.</p>
              ) : (
                historico.map((entry) => {
                  const mp = materiasPrimas.find(m => m.id === entry.materia_prima_id);
                  return (
                    <div key={entry.id}>
                      {/* Mobile Card - Only on small screens */}
                      <div className="md:hidden">
                        <MobileCard
                          title={mp?.nome || 'Item removido'}
                          subtitle={`${new Date(entry.data_entrada).toLocaleDateString()} • ${entry.quantidade} ${mp?.unidade_medida || ''}`}
                          icon={Package}
                          badge={entry.estornado ? { text: 'Estornado', color: 'danger' } : undefined}
                          className={entry.estornado ? 'opacity-60 bg-slate-50' : ''}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-slate-500 font-medium">NF: {entry.nota_fiscal || '-'}</div>
                            {!entry.estornado && (
                              <button
                                onClick={() => handleEstorno(entry.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold active:scale-95 transition-all"
                              >
                                <RefreshCcw size={14} /> Estornar
                              </button>
                            )}
                          </div>
                        </MobileCard>
                      </div>

                      {/* Desktop List Item - Only on medium+ screens */}
                      <div className={`hidden md:block relative pl-4 border-l-2 py-1 ${entry.estornado ? 'border-red-200 opacity-60' : 'border-slate-200'}`}>
                        <div className={`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full border-2 border-white ${entry.estornado ? 'bg-red-400' : 'bg-blue-400'}`}></div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-blue-100 transition-colors group">
                          <div className="flex justify-between items-start mb-1">
                            <span className={`font-semibold text-sm ${entry.estornado ? 'text-red-800 line-through' : 'text-slate-800'}`}>
                              {mp?.nome || 'Item removido'}
                            </span>
                            {!entry.estornado && (
                              <button onClick={() => handleEstorno(entry.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Estornar Lançamento">
                                <RefreshCcw size={14} />
                              </button>
                            )}
                          </div>

                          <div className="text-sm font-mono text-slate-500 mb-1">
                            {new Date(entry.data_entrada).toLocaleDateString()}
                            {entry.estornado && <span className="ml-2 text-red-600 font-bold text-[10px] uppercase">Estornado</span>}
                          </div>

                          {!entry.estornado && (
                            <div className="text-green-600 font-bold text-lg mb-2">
                              +{entry.quantidade} <span className="text-xs font-normal text-slate-500">{mp?.unidade_medida}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EntradaMaterial;
