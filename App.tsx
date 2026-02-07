
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import ModuleSelector from './pages/ModuleSelector';
import Dashboard from './pages/Dashboard';
import MPCadastro from './pages/MPCadastro';
import PACadastro from './pages/PACadastro';
import EstoquePecas from './pages/EstoquePecas';
import NaoConformidades from './pages/NaoConformidades';
import PlanosAcao from './pages/PlanosAcao';
import FormulaCadastro from './pages/FormulaCadastro';
import EntradaMaterial from './pages/EntradaMaterial';
import ControleProducao from './pages/ControleProducao';
import ConferenciaEstoque from './pages/ConferenciaEstoque';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import AIChatAssistant from './components/AIChatAssistant';
import { Menu, X, Cpu } from 'lucide-react';

const AppContent: React.FC<{ isAuthenticated: boolean; onLogin: () => void; onLogout: () => void }> = ({ isAuthenticated, onLogin, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!isAuthenticated) {
    return <Login onLogin={onLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white text-slate-900 p-4 flex justify-between items-center sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Cpu size={24} className="text-blue-600" />
          <span className="text-lg font-extrabold tracking-tight uppercase">QUARTZ 4.0</span>
        </div>

        {/* Removed redundant Menu Button - using BottomNav instead */}
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Navigation - Desktop Only */}
      <aside className={`
        fixed md:relative z-50 w-64 h-full bg-slate-700 text-white flex-shrink-0 transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        hidden md:block
      `}>
        <Sidebar onLogout={onLogout} onCloseSidebar={() => setIsSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden min-h-screen p-4 md:p-8 lg:p-10 bg-white pb-20 md:pb-8">
        <Routes>
          <Route path="/" element={<ModuleSelector onLogout={onLogout} />} />

          {/* Stock Module Sub-routes */}
          <Route path="/estoque/dashboard" element={<Dashboard />} />
          <Route path="/estoque/cadastro/mp" element={<MPCadastro />} />
          <Route path="/estoque/cadastro/pa" element={<PACadastro />} />
          <Route path="/estoque/pecas" element={<EstoquePecas />} />
          <Route path="/estoque/cadastro/formula" element={<FormulaCadastro />} />
          <Route path="/estoque/entrada-material" element={<EntradaMaterial />} />
          <Route path="/estoque/controle-producao" element={<ControleProducao />} />
          <Route path="/estoque/conferencia" element={<ConferenciaEstoque />} />
          <Route path="/estoque/relatorios" element={<Relatorios />} />
          <Route path="/estoque/configuracoes" element={<Configuracoes />} />

          {/* Quality Module */}
          <Route path="/qualidade/nao-conformidades" element={<NaoConformidades />} />
          <Route path="/qualidade/planos-acao" element={<PlanosAcao />} />
          <Route path="/qualidade/configuracoes" element={<Configuracoes />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />

      {/* AI Chat Assistant - Hidden on small screens */}
      <div className="hidden lg:block">
        <AIChatAssistant />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('antigravity_auth');
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    localStorage.setItem('antigravity_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('antigravity_auth');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <AppContent isAuthenticated={isAuthenticated} onLogin={handleLogin} onLogout={handleLogout} />
    </Router>
  );
};

export default App;
