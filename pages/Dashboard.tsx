import React from 'react';
import { estoqueService } from '../services/estoqueService';
import { logger } from '../utils/logger';
import { Package, Box, AlertCircle, Wrench, Download, ShoppingCart, Printer, Clock } from 'lucide-react';
import { Alerta, MecanicaInsumo } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ShoppingItem {
  id: string;
  nome: string;
  tipo: string;
  atual: number;
  minimo: number;
  unidade: string;
  categoria_origem: 'MATERIA_PRIMA' | 'PECA' | 'INSUMO';
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalMP: 0,
    totalPA: 0,
    totalPecas: 0,
    totalInsumos: 0,
    alertasCount: 0
  });

  const [alertas, setAlertas] = React.useState<Alerta[]>([]);
  const [shoppingList, setShoppingList] = React.useState<ShoppingItem[]>([]);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [mps, pas, pecasInsumos] = await Promise.all([
        estoqueService.getMateriasPrimas(),
        estoqueService.getProdutosAcabados(),
        estoqueService.getPecasInsumos()
      ]);

      const totalMP = mps.reduce((acc, curr) => acc + Number(curr.quantidade_atual), 0);
      const totalPA = pas.reduce((acc, curr) => acc + Number(curr.quantidade_atual), 0);

      const pecasMsg = pecasInsumos.filter(p => p.categoria === 'PECA');
      const insumosMsg = pecasInsumos.filter(p => p.categoria === 'INSUMO');

      const totalPecas = pecasMsg.reduce((acc, curr) => acc + Number(curr.quantidade_atual), 0);
      const totalInsumos = insumosMsg.reduce((acc, curr) => acc + Number(curr.quantidade_atual), 0);

      // Generate Alerts & Shopping List
      const alerts: Alerta[] = [];
      const shopList: ShoppingItem[] = [];

      // Check MP
      mps.forEach(mp => {
        if (mp.quantidade_atual <= (mp.minimo_seguranca || 0)) {
          alerts.push({
            id: `mp-${mp.id}`,
            tipo_alerta: 'Estoque Baixo',
            mensagem: `Matéria-Prima: ${mp.nome} (${mp.quantidade_atual} ${mp.unidade_medida})`,
            data_alerta: new Date().toLocaleDateString(),
            status: 'Ativo'
          });
          shopList.push({
            id: mp.id,
            nome: mp.nome,
            tipo: 'Matéria-Prima',
            atual: Number(mp.quantidade_atual),
            minimo: Number(mp.minimo_seguranca),
            unidade: mp.unidade_medida,
            categoria_origem: 'MATERIA_PRIMA'
          });
        }
      });

      // Check Pecas & Insumos
      pecasInsumos.forEach(p => {
        if (p.quantidade_atual <= (p.minimo_seguranca || 0)) {
          alerts.push({
            id: `peca-${p.id}`,
            tipo_alerta: 'Estoque Baixo',
            mensagem: `${p.categoria}: ${p.nome} (${p.quantidade_atual} ${p.unidade_medida})`,
            data_alerta: new Date().toLocaleDateString(),
            status: 'Ativo'
          });
          shopList.push({
            id: p.id,
            nome: p.nome,
            tipo: p.categoria === 'PECA' ? 'Peça Mecânica' : 'Insumo',
            atual: Number(p.quantidade_atual),
            minimo: Number(p.minimo_seguranca),
            unidade: p.unidade_medida,
            categoria_origem: p.categoria === 'PECA' ? 'PECA' : 'INSUMO'
          });
        }
      });

      setStats({
        totalMP,
        totalPA,
        totalPecas,
        totalInsumos,
        alertasCount: alerts.length
      });
      setAlertas(alerts);
      setShoppingList(shopList);
    } catch (error) {
      logger.error('Erro ao carregar dados do dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(40, 116, 166);
    doc.text("Lista de Compras - QuartzRevest", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`, 14, 30);

    // Table
    const tableData = shoppingList.map(item => [
      item.nome,
      item.tipo,
      `${item.atual} ${item.unidade}`,
      `${item.minimo} ${item.unidade}`,
      `${Math.max(0, item.minimo - item.atual)} ${item.unidade}` // Sugestão Reposição (Min - Atual)
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Item', 'Tipo', 'Estoque Atual', 'Mínimo', 'Sugestão Repor']],
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      body: tableData,
    });

    // Footer info
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Documento gerado automaticamente pelo Sistema QuartzRevest", 14, finalY + 10);

    doc.save('lista_de_compras.pdf');
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-500">Visão geral da sua produção e estoque em tempo real.</p>
      </header>

      {/* Stats Grid - Separated by Section */}
      <h2 className="text-lg font-semibold text-slate-700 mt-6">Visão Geral de Estoques</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Materia Prima */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Matéria Prima</p>
              <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : stats.totalMP.toLocaleString()} <span className="text-xs font-normal text-slate-400">un</span></h3>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Package size={24} />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: '70%' }}></div>
          </div>
        </div>

        {/* Produto Acabado */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Produto Acabado</p>
              <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : stats.totalPA.toLocaleString()} <span className="text-xs font-normal text-slate-400">un</span></h3>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <Box size={24} />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Peças Mecânicas */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Peças Mecânicas</p>
              <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : stats.totalPecas.toLocaleString()} <span className="text-xs font-normal text-slate-400">un</span></h3>
            </div>
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <Wrench size={24} />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>

        {/* Insumos */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Insumos</p>
              <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : stats.totalInsumos.toLocaleString()} <span className="text-xs font-normal text-slate-400">un</span></h3>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <ShoppingCart size={24} />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: '30%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shopping List Section (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart size={20} className="text-blue-600" />
              Lista de Compras Virtual
              <span className="ml-2 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {shoppingList.length} itens
              </span>
            </h2>
            <button
              onClick={handleExportPDF}
              disabled={shoppingList.length === 0}
              className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Printer size={16} />
              Exportar PDF
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {shoppingList.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Item</th>
                    <th className="px-6 py-3 font-semibold">Tipo</th>
                    <th className="px-6 py-3 font-semibold">Estoque Atual</th>
                    <th className="px-6 py-3 font-semibold">Mínimo</th>
                    <th className="px-6 py-3 font-semibold text-blue-600">Repor (Sugestão)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {shoppingList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.categoria_origem === 'MATERIA_PRIMA' ? 'bg-blue-400' : 'bg-orange-400'}`} />
                          {item.nome}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-500">{item.tipo}</td>
                      <td className="px-6 py-3 font-bold text-red-600">{item.atual} {item.unidade}</td>
                      <td className="px-6 py-3 text-slate-400">{item.minimo} {item.unidade}</td>
                      <td className="px-6 py-3 font-bold text-blue-600 bg-blue-50/50">
                        +{Math.max(0, item.minimo - item.atual)} {item.unidade}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Package size={48} className="text-slate-200 mb-2" />
                <p>Seu estoque está saudável.</p>
                <p className="text-sm">Nenhum item abaixo do nível mínimo de segurança.</p>
              </div>
            )}
          </div>
        </div>

        {/* Alerts Feed (1/3 width) */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 bg-red-50">
            <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
              <AlertCircle size={20} />
              Alertas Críticos
            </h2>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[500px]">
            {alertas.length > 0 ? (
              alertas.map(alerta => (
                <div key={alerta.id} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <h4 className="text-sm font-bold text-red-700 mb-1">{alerta.tipo_alerta}</h4>
                  <p className="text-sm text-red-600 mb-2">{alerta.mensagem}</p>
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <Clock size={12} /> {alerta.data_alerta}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 text-sm py-4">
                Nenhum alerta ativo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
