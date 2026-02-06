
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Factory, Users, ShoppingCart, BarChart3, LogOut, LayoutGrid, Layers, AlertTriangle } from 'lucide-react';
import Logo from '../components/Logo';

interface ModuleSelectorProps {
  onLogout: () => void;
}

const ModuleSelector: React.FC<ModuleSelectorProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  const modules = [
    {
      id: 'estoque',
      name: 'Módulo Estoque',
      description: 'Gestão de MP, PA, Fórmulas e Conferência de Inventário.',
      icon: Package,
      color: 'bg-blue-600',
      active: true,
      path: '/estoque/dashboard'
    },
    {
      id: 'producao',
      name: 'Produção & PCP',
      description: 'Planejamento e ordens de serviço em tempo real.',
      icon: Factory,
      color: 'bg-slate-400',
      active: false,
    },
    {
      id: 'comercial',
      name: 'Vendas & CRM',
      description: 'Pedidos, faturamento e carteira de clientes.',
      icon: ShoppingCart,
      color: 'bg-slate-400',
      active: false,
    },
    {
      id: 'rh',
      name: 'Recursos Humanos',
      description: 'Gestão de turnos, operadores e segurança do trabalho.',
      icon: Users,
      color: 'bg-slate-400',
      active: false,
    },
    {
      id: 'qualidade',
      name: 'Não Conformidades',
      description: 'Gestão de RNCs, Planos de Ação (5W2H) e Análise de Causa (5 Porquês).',
      icon: AlertTriangle,
      color: 'bg-red-500',
      active: true,
      path: '/qualidade/nao-conformidades'
    },
    {
      id: 'analytics',
      name: 'Quartz Analytics',
      description: 'BI completo com KPIs globais da planta.',
      icon: BarChart3,
      color: 'bg-slate-400',
      active: false,
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <Logo />
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-neutral-500 hover:text-red-600 font-bold transition-colors text-sm"
        >
          <LogOut size={18} />
          Sair
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-4xl font-black text-neutral-900 tracking-tight">Selecione o Ambiente</h2>
          <p className="text-neutral-500 font-medium">QuartzRevest 4.0 — Ecossistema de Gestão Industrial</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {modules.map((mod) => (
            <button
              key={mod.id}
              disabled={!mod.active}
              onClick={() => mod.path && navigate(mod.path)}
              className={`
                relative group flex flex-col p-8 rounded-3xl border transition-all duration-300 text-left
                ${mod.active
                  ? 'bg-white border-neutral-200 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-600/10 cursor-pointer active:scale-[0.98]'
                  : 'bg-neutral-100 border-neutral-200 opacity-60 cursor-not-allowed'}
              `}
            >
              <div className={`
                w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110
                ${mod.active ? mod.color + ' text-white' : 'bg-neutral-300 text-neutral-500'}
              `}>
                <mod.icon size={28} />
              </div>

              <h3 className="text-xl font-bold text-neutral-900 mb-2">{mod.name}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{mod.description}</p>

              {!mod.active && (
                <div className="absolute top-4 right-4 bg-neutral-200 text-neutral-600 text-[10px] font-black uppercase px-2 py-1 rounded">
                  Em Breve
                </div>
              )}

              {mod.active && (
                <div className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Acessar Módulo
                  <div className="w-4 h-0.5 bg-blue-600 rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-neutral-200 shadow-sm">
            <LayoutGrid size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-neutral-600 italic">"Conectando a produção ao futuro da indústria."</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-8 text-center text-neutral-400 text-xs">
        QuartzRevest 4.0 &copy; {new Date().getFullYear()} — Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default ModuleSelector;
