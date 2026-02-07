
import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { APP_VERSION } from '../src/version';
import {
  LayoutDashboard, Package, Box, FlaskConical, AlertTriangle,
  Warehouse, Factory, BarChart, Settings, LogOut, ClipboardCheck, ArrowLeft, Wrench, ListTodo, Shield, Users, Key, FolderKanban
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  onCloseSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, onCloseSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentModule = location.pathname.split('/')[1]; // 'estoque' or 'qualidade'

  const stockNavItems = [
    { name: 'Dashboard', path: '/estoque/dashboard', icon: LayoutDashboard },
    { name: 'Minhas Tarefas', path: '/estoque/tarefas', icon: ListTodo },
    { name: 'Matéria-Prima', path: '/estoque/cadastro/mp', icon: Package },
    { name: 'Produto Acabado', path: '/estoque/cadastro/pa', icon: Box },
    { name: 'Peças e Insumos', path: '/estoque/pecas', icon: Wrench },
    { name: 'Fórmulas', path: '/estoque/cadastro/formula', icon: FlaskConical },
    { name: 'Entrada de Material', path: '/estoque/entrada-material', icon: Warehouse },
    { name: 'Controle de Produção', path: '/estoque/controle-producao', icon: Factory },
    { name: 'Conferência Estoque', path: '/estoque/conferencia', icon: ClipboardCheck },
    { name: 'Relatórios', path: '/estoque/relatorios', icon: BarChart },
    { name: 'Configurações', path: '/estoque/configuracoes', icon: Settings },
  ];

  const qualityNavItems = [
    { name: 'Não Conformidades', path: '/qualidade/nao-conformidades', icon: AlertTriangle },
    { name: 'Planos de Ação', path: '/qualidade/planos-acao', icon: ClipboardCheck },
    { name: 'Minhas Tarefas', path: '/qualidade/tarefas', icon: ListTodo },
    { name: 'Configurações', path: '/qualidade/configuracoes', icon: Settings },
  ];

  const securityNavItems = [
    { name: 'Usuários', path: '/seguranca/usuarios', icon: Users },
    { name: 'Perfis', path: '/seguranca/perfis', icon: Shield },
    { name: 'Permissões', path: '/seguranca/permissoes', icon: Key },
  ];

  const projectsNavItems = [
    { name: 'Dashboard', path: '/projetos/dashboard', icon: LayoutDashboard },
    { name: 'Projetos', path: '/projetos/consulta', icon: FolderKanban },
    { name: 'Tarefas', path: '/projetos/tarefas-consulta', icon: ListTodo },
  ];

  const pcpNavItems = [
    { name: 'Dashboard PCP', path: '/pcp', icon: LayoutDashboard },
    { name: 'Planejamento', path: '/pcp/planejamento', icon: ClipboardCheck },
    { name: 'Produção em Tempo Real', path: '/pcp/producao', icon: Factory },
    { name: 'Histórico', path: '/pcp/historico', icon: BarChart },
  ];

  const generalNavItems = [
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ];

  let navItems = generalNavItems;
  let moduleName = 'Menu Principal';
  let moduleColor = 'bg-slate-700';

  if (currentModule === 'qualidade') {
    navItems = qualityNavItems;
    moduleName = 'Qualidade';
    moduleColor = 'bg-red-600';
  } else if (currentModule === 'estoque') {
    navItems = stockNavItems;
    moduleName = 'Estoque';
    moduleColor = 'bg-blue-600';
  } else if (currentModule === 'seguranca') {
    navItems = securityNavItems;
    moduleName = 'Segurança';
    moduleColor = 'bg-purple-600';
  } else if (currentModule === 'projetos') {
    moduleName = 'Projetos';
    moduleColor = 'bg-teal-600';
  } else if (currentModule === 'pcp') {
    navItems = pcpNavItems;
    moduleName = 'Produção PCP';
    moduleColor = 'bg-blue-800';
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className={`${moduleColor} p-1.5 rounded-lg`}>
            <Logo showText={false} className="scale-75 invert" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tighter text-white uppercase leading-none">QuartzRevest</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{moduleName}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-600 text-slate-400 hover:text-white text-xs font-bold rounded-lg transition-all border border-slate-600/30"
        >
          <ArrowLeft size={14} />
          Mudar de Módulo
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onCloseSidebar}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${isActive
                ? `${moduleColor} text-white shadow-lg`
                : 'hover:bg-slate-600 text-slate-300'}
            `}
          >
            <item.icon size={18} />
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-600/50">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-400 hover:text-white hover:bg-red-600/20 hover:text-red-400 rounded-lg transition-colors mb-2"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Sair do Sistema</span>
        </button>
        <div className="px-4 text-[10px] sm:text-xs text-slate-500 font-mono tracking-wide">
          v{APP_VERSION}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
