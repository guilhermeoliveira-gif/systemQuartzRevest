
import React, { useState, useEffect } from 'react';
import { estoqueService } from '../services/estoqueService';
import { ProdutoAcabado } from '../types';
import { Factory, CheckCircle, PackageCheck } from 'lucide-react';

const ControleProducao: React.FC = () => {
  const [produtos, setProdutos] = useState<ProdutoAcabado[]>([]);
  const [selectedPA, setSelectedPA] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await estoqueService.getProdutosAcabados();
      setProdutos(data || []);
      console.log('Produtos carregados:', data?.length);
    } catch (e) {
      console.error('Erro ao carregar produtos:', e);
      setToast('❌ Erro ao carregar produtos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPA || qty <= 0) return;

    try {
      await estoqueService.addProducao({
        produto_acabado_id: selectedPA,
        quantidade_produzida: qty,
        usuario_id: 'CURRENT_USER', // TODO: Use real user ID
        desvio_status: 'OK'
      });

      setToast(`✅ Produção de ${qty} itens registrada com sucesso! Estoque atualizado.`);

      // Reset form
      setQty(0);
      setSelectedPA('');
      loadData(); // Refresh list to verify

      setTimeout(() => setToast(null), 5000);
    } catch (error) {
      setToast('❌ Erro ao registrar produção.');
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
          <Factory className="text-blue-600" />
          Registro de Produção
        </h1>
        <p className="text-neutral-500">Registre a saída da linha de produção. O desvio de consumo será calculado posteriormente na conferência.</p>
      </header>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">Produto Acabado</label>
              <select
                value={selectedPA}
                onChange={e => setSelectedPA(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none disabled:bg-gray-100"
                required
                disabled={isLoading}
              >
                <option value="">{isLoading ? 'Carregando produtos...' : 'Selecione o produto...'}</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} (Atual: {p.quantidade_atual} {p.unidade_medida})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">Quantidade Produzida</label>
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="0"
                  min="1"
                  value={qty || ''}
                  onChange={e => setQty(parseFloat(e.target.value))}
                  className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 flex gap-4">
            <PackageCheck size={24} className="text-blue-600 shrink-0" />
            <div>
              <h3 className="text-blue-800 font-bold mb-1">Processo Simplificado</h3>
              <p className="text-blue-600 text-sm">
                Ao registrar, o estoque do <strong>Produto Acabado</strong> aumenta.
                O consumo de <strong>Matéria Prima</strong> será deduzido automaticamente baseado na fórmula padrão.
                Ajustes finos e análise de desvios ocorrerão na etapa de Conferência.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={qty <= 0 || !selectedPA}
              className="w-full bg-blue-600 disabled:bg-slate-400 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              Confirmar Produção
            </button>
          </div>
        </form>
      </div>

      {/* Mini Dashboard of Recent Production */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Produtos Disponíveis (Visão Rápida)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {produtos.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200">
              <div className="text-sm text-slate-500 mb-1">Stock Atual</div>
              <div className="text-2xl font-bold text-slate-800">{p.quantidade_atual} <span className="text-sm font-normal text-slate-400">{p.unidade_medida}</span></div>
              <div className="font-medium text-slate-700 mt-2 truncate" title={p.nome}>{p.nome}</div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg p-4 rounded-xl shadow-2xl border flex items-start gap-4 animate-in slide-in-from-bottom bg-green-50 border-green-200 text-green-800">
          <CheckCircle size={24} className="shrink-0" />
          <p className="font-medium text-sm leading-relaxed">{toast}</p>
        </div>
      )}
    </div>
  );
};

export default ControleProducao;
