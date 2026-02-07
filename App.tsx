import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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
import CadastroProjeto from './pages/CadastroProjeto';
import CadastroTarefa from './pages/CadastroTarefa';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes - Auth */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<ModuleSelector />} />
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
              <Route path="/projetos/cadastro" element={<CadastroProjeto />} />
              <Route path="/projetos/tarefas" element={<CadastroTarefa />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
