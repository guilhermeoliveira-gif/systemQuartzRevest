
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Factory, Users, ShoppingCart, BarChart3, AlertTriangle } from 'lucide-react';

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
      color: 'from-blue-600 to-blue-700',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      active: true,
      path: '/estoque/dashboard'
    },
    {
      id: 'producao',
      name: 'Produção & PCP',
      description: 'Planejamento e ordens de serviço em tempo real.',
      icon: Factory,
      color: 'from-slate-500 to-slate-600',
      borderColor: 'border-slate-200',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      active: false,
    },
    {
      id: 'comercial',
      name: 'Vendas & CRM',
      description: 'Pedidos, faturamento e carteira de clientes.',
      icon: ShoppingCart,
      color: 'from-slate-500 to-slate-600',
      borderColor: 'border-slate-200',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      active: false,
    },
    {
      id: 'rh',
      name: 'Recursos Humanos',
      description: 'Gestão de turnos, operadores e segurança do trabalho.',
      icon: Users,
      color: 'from-slate-500 to-slate-600',
      borderColor: 'border-slate-200',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      active: false,
    },
    {
      id: 'qualidade',
      name: 'Não Conformidades',
      description: 'Gestão de RNCs, Planos de Ação (5W2H) e Análise de Causa (5 Porquês).',
      icon: AlertTriangle,
      color: 'from-red-600 to-red-700',
      borderColor: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      active: true,
      path: '/qualidade/nao-conformidades'
    },
    {
      id: 'analytics',
      name: 'Quartz Analytics',
      description: 'BI completo com KPIs globais da planta.',
      icon: BarChart3,
      color: 'from-slate-500 to-slate-600',
      borderColor: 'border-slate-200',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      active: false,
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">QuartzRevest 4.0</h1>
              <p className="text-slate-600 text-sm font-medium">Ecossistema de Gestão Industrial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Selecione o Módulo</h2>
          <p className="text-slate-600 text-sm">Escolha o ambiente de trabalho para começar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <button
              key={mod.id}
              disabled={!mod.active}
              onClick={() => mod.path && navigate(mod.path)}
              className={`
                relative group bg-white rounded-lg border-2 transition-all duration-300 text-left overflow-hidden
                ${mod.active
                  ? `${mod.borderColor} hover:shadow-xl hover:scale-[1.02] cursor-pointer`
                  : 'border-slate-200 opacity-60 cursor-not-allowed'}
              `}
            >
              {/* Card Header with Icon */}
              <div className={`p-6 ${mod.active ? `bg-gradient-to-r ${mod.color}` : 'bg-slate-100'}`}>
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${mod.active ? 'bg-white/20' : 'bg-slate-200'}`}>
                  <mod.icon size={28} className={mod.active ? 'text-white' : 'text-slate-400'} />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{mod.name}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{mod.description}</p>

                {!mod.active && (
                  <div className="inline-block bg-slate-100 text-slate-600 text-xs font-bold uppercase px-3 py-1 rounded">
                    Em Breve
                  </div>
                )}

                {mod.active && (
                  <div className={`flex items-center gap-2 text-sm font-semibold ${mod.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Acessar Módulo
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Active Indicator */}
              {mod.active && (
                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${mod.color} opacity-10 rounded-bl-full`}></div>
              )}
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-slate-700">Sistema Online</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">v4.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleSelector;
