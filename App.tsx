import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { GlobalErrorProvider } from './contexts/GlobalErrorContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
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
import EstoqueHistorico from './pages/EstoqueHistorico';
import EstoqueAjuste from './pages/EstoqueAjuste';
import EstoqueConfig from './pages/EstoqueConfig';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import MinhasTarefas from './pages/MinhasTarefas';
import Perfil from './pages/Perfil';
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
import ManutencaoPreventiva from './pages/Manutencao/ManutencaoPreventiva';
import Maquinas from './pages/Manutencao/Maquinas';
import MaquinaDetalhes from './pages/Manutencao/MaquinaDetalhes';
import OrdensServico from './pages/Manutencao/OrdensServico';
import ManutencaoPlanosAdmin from './pages/Manutencao/ManutencaoPlanosAdmin';

// Checklist Module
import ChecklistCadastro from './pages/Checklist/ChecklistCadastro';
import ChecklistAgendamento from './pages/Checklist/ChecklistAgendamento';
import ChecklistExecucao from './pages/Checklist/ChecklistExecucao';

// Compras Module
import { ComprasDashboard } from './pages/compras/ComprasDashboard';
import { ListaPedidos } from './pages/compras/ListaPedidos';
import { NovoPedidoCompra } from './pages/compras/NovoPedidoCompra';
import DetalhePedido from './pages/compras/DetalhePedido';
import GestaoCotacoes from './pages/compras/GestaoCotacoes';
import NovaCotacao from './pages/compras/NovaCotacao';
import DetalheCotacao from './pages/compras/DetalheCotacao';

import VendasDashboard from './pages/Vendas/VendasDashboard';
import ClientesList from './pages/Vendas/ClientesList';
import CadastroPedido from './pages/Vendas/CadastroPedido';
import MontagemCarga from './pages/Expedicao/MontagemCarga';
import GestaoPendencias from './pages/Expedicao/GestaoPendencias';

// Frotas Module
import FrotaDashboard from './pages/Frotas/FrotaDashboard';
import GestaoFrotas from './pages/Frotas/GestaoFrotas';
import VeiculoDetalhes from './pages/Frotas/VeiculoDetalhes';
import FrotaAbastecimentos from './pages/Frotas/FrotaAbastecimentos';
import FrotaManutencoes from './pages/Frotas/FrotaManutencoes';
import TestConnection from './pages/TestConnection';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <GlobalErrorProvider>
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
                    <Route path="/minhas-tarefas" element={<MinhasTarefas />} />
                    <Route path="/perfil" element={<Perfil />} />
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
                    <Route path="/estoque/historico" element={<EstoqueHistorico />} />
                    <Route path="/estoque/ajuste" element={<EstoqueAjuste />} />
                    <Route path="/estoque/alertas-config" element={<EstoqueConfig />} />
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
                    <Route path="/manutencao/preventiva" element={<ManutencaoPreventiva />} />
                    <Route path="/manutencao/maquinas" element={<Maquinas />} />
                    <Route path="/manutencao/maquinas/:id" element={<MaquinaDetalhes />} />
                    <Route path="/manutencao/os" element={<OrdensServico />} />
                    <Route path="/manutencao/planos" element={<ManutencaoPlanosAdmin />} />

                    {/* Checklist Module */}
                    <Route path="/checklist/cadastro" element={<ChecklistCadastro />} />
                    <Route path="/checklist/agendamento" element={<ChecklistAgendamento />} />
                    <Route path="/checklist/execucao/:agendamentoId" element={<ChecklistExecucao />} />

                    {/* Compras Module */}
                    <Route path="/compras" element={<ComprasDashboard />} />
                    <Route path="/compras/pedidos" element={<ListaPedidos />} />
                    <Route path="/compras/novo" element={<NovoPedidoCompra />} />
                    <Route path="/compras/pedidos/:id" element={<DetalhePedido />} />
                    <Route path="/compras/cotacoes" element={<GestaoCotacoes />} />
                    <Route path="/compras/cotacoes/nova" element={<NovaCotacao />} />
                    <Route path="/compras/cotacoes/:id" element={<DetalheCotacao />} />

                    {/* Vendas Module */}
                    <Route path="/vendas" element={<VendasDashboard />} />
                    <Route path="/vendas/clientes" element={<ClientesList />} />
                    <Route path="/vendas/novo" element={<CadastroPedido />} />

                    {/* Expedição Module */}
                    <Route path="/expedicao/nova" element={<MontagemCarga />} />
                    <Route path="/expedicao/pendencias" element={<GestaoPendencias />} />

                    {/* Frotas Module */}
                    <Route path="/frotas" element={<FrotaDashboard />} />
                    <Route path="/frotas/veiculos" element={<GestaoFrotas />} />
                    <Route path="/frotas/abastecimentos" element={<FrotaAbastecimentos />} />
                    <Route path="/frotas/manutencoes" element={<FrotaManutencoes />} />
                    <Route path="/frotas/:id" element={<VeiculoDetalhes />} />
                    <Route path="/test-connection" element={<TestConnection />} />
                  </Route>
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </GlobalErrorProvider>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
