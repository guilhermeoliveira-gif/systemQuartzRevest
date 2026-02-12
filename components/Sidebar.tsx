import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { APP_VERSION } from '../src/version';
import { LogOut, ArrowLeft, Settings } from 'lucide-react';
import { modules } from '../config/modules';

interface SidebarProps {
  onLogout: () => void;
  onCloseSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, onCloseSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Encontrar módulo ativo baseado na URL
  // Ex: /estoque/dashboard -> id='estoque'
  const currentModuleId = currentPath.split('/')[1] || 'dashboard';

  // Buscar config do módulo
  const activeModule = modules.find(m => m.id === currentModuleId) || modules.find(m => m.id === 'dashboard');

  // Definir itens de navegação (fallback para Configurações Gerais se não tiver subitems)
  const navItems = activeModule?.subItems && activeModule.subItems.length > 0
    ? activeModule.subItems
    : [{ name: 'Configurações', path: '/configuracoes', icon: Settings }];

  const moduleColor = activeModule?.color.replace('from-', 'bg-').split(' ')[0] || 'bg-slate-700';
  const moduleName = activeModule?.name || 'Menu Principal';

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className={`${moduleColor} p-2 rounded-xl shadow-lg ring-1 ring-white/10`}>
            <Logo showText={false} className="scale-75 invert" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tighter text-white uppercase leading-none">QuartzRevest</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{moduleName}</span>
          </div>
        </div>

        <button
          onClick={() => {
            onCloseSidebar();
            navigate('/');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all border border-slate-700 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Trocar Módulo
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onCloseSidebar}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
              ${isActive
                ? `bg-gradient-to-r ${activeModule?.color || 'from-slate-700 to-slate-800'} text-white shadow-lg shadow-black/20 border border-white/10`
                : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} />
                <span className="font-medium text-sm">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors mb-2 group"
        >
          <LogOut size={18} className="group-hover:text-red-400 transition-colors" />
          <span className="font-medium text-sm">Sair do Sistema</span>
        </button>
        <div className="px-4 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-slate-600">
          <span>Quartz System</span>
          <span>v{APP_VERSION}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
