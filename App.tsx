import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import Login from './pages/auth/Login';

// Pages
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
import MinhasTarefas from './pages/MinhasTarefas';
import CadastroUsuarios from './pages/CadastroUsuarios';
import CadastroPerfis from './pages/CadastroPerfis';
import PerfilPermissoes from './pages/PerfilPermissoes';
import ProjetosDashboard from './pages/ProjetosDashboard';
import Projetos from './pages/Projetos';
import Tarefas from './pages/Tarefas';
import ProjetoDetalhes from './pages/ProjetoDetalhes';
import DashboardGlobal from './pages/DashboardGlobal';

// PCP Module
import PCPDashboard from './pages/PCP/PCPDashboard';
import PCPPlanejamento from './pages/PCP/PCPPlanejamento';
import PCPProducao from './pages/PCP/PCPProducao';
import PCPHistorico from './pages/PCP/PCPHistorico';

// Manutenção Module
import ManutencaoDashboard from './pages/Manutencao/ManutencaoDashboard';
import Maquinas from './pages/Manutencao/Maquinas';
import MaquinaDetalhes from './pages/Manutencao/MaquinaDetalhes';
import OrdensServico from './pages/Manutencao/OrdensServico';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes - Auth */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<ModuleSelector />} />
                <Route path="/dashboard" element={<DashboardGlobal />} />
                <Route path="/configuracoes" element={<Configuracoes />} />

                {/* Stock Module */}
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
                <Route path="/estoque/tarefas" element={<MinhasTarefas />} />

                {/* Quality Module */}
                <Route path="/qualidade/nao-conformidades" element={<NaoConformidades />} />
                <Route path="/qualidade/planos-acao" element={<PlanosAcao />} />
                <Route path="/qualidade/configuracoes" element={<Configuracoes />} />
                <Route path="/qualidade/tarefas" element={<MinhasTarefas />} />

                {/* Security Module */}
                <Route path="/seguranca/usuarios" element={<CadastroUsuarios />} />
                <Route path="/seguranca/perfis" element={<CadastroPerfis />} />
                <Route path="/seguranca/permissoes" element={<PerfilPermissoes />} />

                {/* Projects Module */}
                <Route path="/projetos/dashboard" element={<ProjetosDashboard />} />
                <Route path="/projetos/consulta" element={<Projetos />} />
                <Route path="/projetos/detalhes/:id" element={<ProjetoDetalhes />} />
                <Route path="/projetos/tarefas-consulta" element={<Tarefas />} />

                {/* PCP Module */}
                <Route path="/pcp" element={<PCPDashboard />} />
                <Route path="/pcp/planejamento" element={<PCPPlanejamento />} />
                <Route path="/pcp/producao" element={<PCPProducao />} />
                <Route path="/pcp/historico" element={<PCPHistorico />} />

                {/* Manutenção Module */}
                <Route path="/manutencao" element={<ManutencaoDashboard />} />
                <Route path="/manutencao/maquinas" element={<Maquinas />} />
                <Route path="/manutencao/maquinas/:id" element={<MaquinaDetalhes />} />
                <Route path="/manutencao/os" element={<OrdensServico />} />
              </Route>
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
