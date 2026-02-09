
import React, { useState, useEffect } from 'react';
import { ClipboardCheck, RefreshCcw, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { MateriaPrima, ProdutoAcabado } from '../types';
import { store } from '../services/store';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';

interface ItemConferencia {
  id: string;
  nome: string;
  unidade: string;
  saldoSistema: number;
  contagemFisica: number;
}

const ConferenciaEstoque: React.FC = () => {
  const toast = useToast();
  const [categoria, setCategoria] = useState<'MP' | 'PA'>('MP');
  const [itens, setItens] = useState<ItemConferencia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [categoria]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      if (categoria === 'MP') {
        const materias = await store.getMateriasPrimas();
        const itensConferencia: ItemConferencia[] = materias.map(m => ({
          id: m.id,
          nome: m.nome,
          unidade: m.unidade_medida,
          saldoSistema: m.estoque_atual || m.quantidade_atual,
          contagemFisica: m.estoque_atual || m.quantidade_atual
        }));
        setItens(itensConferencia);
      } else {
        const produtos = await store.getProdutosAcabados();
        const itensConferencia: ItemConferencia[] = produtos.map(p => ({
          id: p.id,
          nome: p.nome,
          unidade: p.unidade_medida,
          saldoSistema: p.estoque_atual || p.quantidade_atual,
          contagemFisica: p.estoque_atual || p.quantidade_atual
        }));
        setItens(itensConferencia);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro', 'Falha ao carregar itens para conferência.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContagemChange = (id: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setItens(prev => prev.map(item =>
      item.id === id ? { ...item, contagemFisica: numValue } : item
    ));
  };

  const handleConfirmarBalanco = async () => {
    try {
      setIsLoading(true);

      // Atualizar estoques no banco
      for (const item of itens) {
        const divergencia = item.contagemFisica - item.saldoSistema;

        if (divergencia !== 0) {
          if (categoria === 'MP') {
            await supabase
              .from('materia_prima')
              .update({
                estoque_atual: item.contagemFisica,
                quantidade_atual: item.contagemFisica
              })
              .eq('id', item.id);
          } else {
            await supabase
              .from('produto_acabado')
              .update({
                estoque_atual: item.contagemFisica,
                quantidade_atual: item.contagemFisica
              })
              .eq('id', item.id);
          }
        }
      }

      toast.success('Sucesso', '✅ Balanço confirmado! Estoques atualizados.');
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        loadData(); // Recarregar dados
      }, 3000);
    } catch (error) {
      console.error('Erro ao confirmar balanço:', error);
      toast.error('Erro', 'Falha ao processar balanço.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItens = itens.filter(item =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <ClipboardCheck className="text-blue-600" />
            Conferência de Estoque
          </h1>
          <p className="text-neutral-500">Realize o inventário físico e identifique divergências no sistema.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-neutral-200">
          <button
            onClick={() => setCategoria('MP')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${categoria === 'MP' ? 'bg-white shadow-sm text-blue-600' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Matéria-Prima
          </button>
          <button
            onClick={() => setCategoria('PA')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${categoria === 'PA' ? 'bg-white shadow-sm text-blue-600' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Produto Acabado
          </button>
        </div>
      </header>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Buscar item para conferência..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
          </div>
          <button
            onClick={loadData}
            className="flex items-center justify-center gap-2 text-neutral-600 hover:text-blue-600 font-bold text-sm px-4 py-2 transition-colors"
          >
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
            Recarregar Dados
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Item / Descrição</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Saldo Sistema</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Contagem Física</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Divergência</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6"><div className="h-4 bg-neutral-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredItens.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 italic">Nenhum item encontrado para esta categoria.</td>
                </tr>
              ) : (
                filteredItens.map((item) => {
                  const divergencia = item.contagemFisica - item.saldoSistema;
                  const hasDivergencia = divergencia !== 0;

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-900">{item.nome}</span>
                          <span className="text-xs text-neutral-500 uppercase">{item.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm">
                        {item.saldoSistema} {item.unidade}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="w-24 px-3 py-1.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-bold"
                            value={item.contagemFisica}
                            onChange={(e) => handleContagemChange(item.id, e.target.value)}
                          />
                          <span className="text-xs text-neutral-400 uppercase font-bold">{item.unidade}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-mono font-bold ${divergencia < 0 ? 'text-red-600' : divergencia > 0 ? 'text-blue-600' : 'text-neutral-400'}`}>
                          {divergencia > 0 ? `+${divergencia}` : divergencia}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {hasDivergencia ? (
                          <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs uppercase bg-red-50 px-2.5 py-1 rounded-full border border-red-100 w-fit">
                            <AlertCircle size={14} />
                            Divergente
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs uppercase bg-green-50 px-2.5 py-1 rounded-full border border-green-100 w-fit">
                            <CheckCircle2 size={14} />
                            Acuracidade OK
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-neutral-600">
            * Ao confirmar, o sistema registrará um log de inventário e os saldos serão ajustados conforme a contagem física.
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="px-6 py-2.5 bg-white border border-neutral-300 rounded-xl font-bold text-neutral-700 hover:bg-neutral-50 transition-all"
            >
              Descartar
            </button>
            <button
              onClick={handleConfirmarBalanco}
              disabled={isLoading || itens.length === 0}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <RefreshCcw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Confirmar Balanço 4.0
            </button>
          </div>
        </div>
      </div>

      {isSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top duration-500">
          <div className="bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 size={24} />
            <div className="flex flex-col">
              <span className="font-bold">Balanço Processado!</span>
              <span className="text-xs text-green-100">Os dados de estoque foram sincronizados com sucesso.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConferenciaEstoque;
