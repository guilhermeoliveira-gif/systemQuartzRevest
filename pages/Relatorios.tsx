
import React from 'react';
import { BarChart3, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Relatorios: React.FC = () => {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900">Relatórios e Análises</h1>
        <p className="text-neutral-500">Acompanhe a eficiência da sua produção e custos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-700 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-neutral-500">Eficiência Mensal</p>
            <span className="flex items-center text-green-600 text-xs font-bold">
              <ArrowUpRight size={14} /> +12%
            </span>
          </div>
          <h3 className="text-2xl font-bold">94.2%</h3>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: '94.2%' }}></div>
          </div>
        </div>

        <div className="bg-white border border-neutral-700 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-neutral-500">Custo Médio de Produção</p>
            <span className="flex items-center text-red-600 text-xs font-bold">
              <ArrowUpRight size={14} /> +2.4%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-neutral-900">R$ 142,50</h3>
          <p className="text-xs text-neutral-400 mt-2">Baseado nos últimos 30 dias</p>
        </div>

        <div className="bg-white border border-neutral-700 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-neutral-500">Desperdício de Material</p>
            <span className="flex items-center text-green-600 text-xs font-bold">
              <ArrowDownRight size={14} /> -5%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-neutral-900">1.8%</h3>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: '1.8%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Produção por Semana
          </h3>
          <div className="h-64 flex items-end gap-4">
            {[45, 60, 55, 80, 70, 95, 85].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-blue-600/20 group-hover:bg-blue-600 transition-colors rounded-t"
                  style={{ height: `${val}%` }}
                ></div>
                <span className="text-[10px] text-neutral-500 font-bold uppercase">S{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-neutral-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-blue-600" />
            Distribuição de Custos
          </h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center">
               <span className="text-sm text-neutral-600 flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-600"></div> Matéria-Prima
               </span>
               <span className="text-sm font-bold">65%</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm text-neutral-600 flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-slate-500"></div> Mão de Obra
               </span>
               <span className="text-sm font-bold">20%</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm text-neutral-600 flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-neutral-400"></div> Outros
               </span>
               <span className="text-sm font-bold">15%</span>
             </div>
          </div>
          <div className="mt-8 flex justify-center">
             <div className="relative w-32 h-32 rounded-full border-8 border-blue-600 border-l-slate-500 border-b-neutral-400 rotate-45 flex items-center justify-center">
               <div className="absolute inset-0 flex items-center justify-center text-xs font-bold -rotate-45">Geral</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
