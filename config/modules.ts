import {
    LayoutDashboard, Package, Box, FlaskConical, AlertTriangle,
    Warehouse, Factory, BarChart, Settings, ClipboardCheck, Wrench, ListTodo, Shield, Users, Key, FolderKanban, Truck, Fuel, ShoppingCart, FileText, ClipboardList, BarChart3
} from 'lucide-react';

export interface ModuleConfig {
    id: string;
    name: string;
    description: string;
    icon: any;
    color: string;
    borderColor: string;
    iconBg: string;
    iconColor: string;
    active: boolean;
    path?: string;
    subItems?: NavItem[];
}

export interface NavItem {
    name: string;
    path: string;
    icon: any;
}

export const modules: ModuleConfig[] = [
    {
        id: 'dashboard',
        name: 'Dashboard Global',
        description: 'Visão geral de todos os módulos do sistema.',
        icon: BarChart3,
        color: 'from-indigo-600 to-indigo-700',
        borderColor: 'border-indigo-200',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        active: true,
        path: '/dashboard'
    },
    {
        id: 'estoque',
        name: 'Estoque',
        description: 'Gestão de MP, PA, Fórmulas e Conferência.',
        icon: Package,
        color: 'from-blue-600 to-blue-700',
        borderColor: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        active: true,
        path: '/estoque/dashboard',
        subItems: [
            { name: 'Dashboard', path: '/estoque/dashboard', icon: LayoutDashboard },
            { name: 'Minhas Tarefas', path: '/estoque/tarefas', icon: ListTodo },
            { name: 'Matéria-Prima', path: '/estoque/cadastro/mp', icon: Package },
            { name: 'Produto Acabado', path: '/estoque/cadastro/pa', icon: Box },
            { name: 'Peças e Insumos', path: '/estoque/pecas', icon: Wrench },
            { name: 'Fórmulas', path: '/estoque/cadastro/formula', icon: FlaskConical },
            { name: 'Entrada Material', path: '/estoque/entrada-material', icon: Warehouse },
            { name: 'Produção', path: '/estoque/controle-producao', icon: Factory },
            { name: 'Conferência', path: '/estoque/conferencia', icon: ClipboardCheck },
            { name: 'Relatórios', path: '/estoque/relatorios', icon: BarChart },
            { name: 'Configurações', path: '/estoque/configuracoes', icon: Settings },
        ]
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
        active: true,
        path: '/vendas',
        subItems: [
            { name: 'Dashboard', path: '/vendas', icon: LayoutDashboard },
            { name: 'Novo Pedido', path: '/vendas/novo', icon: ShoppingCart },
            { name: 'Clientes', path: '/vendas/clientes', icon: Users },
        ]
    },
    {
        id: 'expedicao',
        name: 'Expedição & Logística',
        description: 'Gestão de cargas, entregas e pendências.',
        icon: Truck,
        color: 'from-indigo-600 to-indigo-700',
        borderColor: 'border-indigo-200',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        active: true,
        path: '/expedicao/nova',
        subItems: [
            { name: 'Nova Carga', path: '/expedicao/nova', icon: Truck },
            { name: 'Pendências', path: '/expedicao/pendencias', icon: ListTodo },
        ]
    },
    {
        id: 'checklist',
        name: 'Checklist & Inspeções',
        description: 'Inspeções de rotina e segurança.',
        icon: ClipboardList,
        color: 'from-green-600 to-green-700',
        borderColor: 'border-green-200',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        active: true,
        path: '/checklist/agendamento',
        subItems: [
            { name: 'Agendamento', path: '/checklist/agendamento', icon: ClipboardList },
            { name: 'Modelos', path: '/checklist/cadastro', icon: Settings },
        ]
    },
    {
        id: 'producao',
        name: 'Produção & PCP',
        description: 'Planejamento e controle de produção.',
        icon: Factory,
        color: 'from-blue-800 to-blue-900',
        borderColor: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-800',
        active: true,
        path: '/pcp',
        subItems: [
            { name: 'Dashboard PCP', path: '/pcp', icon: LayoutDashboard },
            { name: 'Planejamento', path: '/pcp/planejamento', icon: ClipboardCheck },
            { name: 'Executar Produção', path: '/pcp/producao', icon: Factory },
            { name: 'Histórico', path: '/pcp/historico', icon: BarChart },
        ]
    },
    {
        id: 'qualidade',
        name: 'Qualidade',
        description: 'RNCs, Planos de Ação e Análise de Causa.',
        icon: AlertTriangle,
        color: 'from-red-600 to-red-700',
        borderColor: 'border-red-200',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        active: true,
        path: '/qualidade/nao-conformidades',
        subItems: [
            { name: 'Não Conformidades', path: '/qualidade/nao-conformidades', icon: AlertTriangle },
            { name: 'Planos de Ação', path: '/qualidade/planos-acao', icon: ClipboardCheck },
            { name: 'Minhas Tarefas', path: '/qualidade/tarefas', icon: ListTodo },
            { name: 'Configurações', path: '/qualidade/configuracoes', icon: Settings },
        ]
    },
    {
        id: 'manutencao',
        name: 'Manutenção',
        description: 'Gestão de máquinas e OS.',
        icon: Wrench,
        color: 'from-orange-600 to-orange-700',
        borderColor: 'border-orange-200',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        active: true,
        path: '/manutencao',
        subItems: [
            { name: 'Dashboard Saúde', path: '/manutencao', icon: LayoutDashboard },
            { name: 'Gestão de Máquinas', path: '/manutencao/maquinas', icon: Settings },
            { name: 'Ordens de Serviço', path: '/manutencao/os', icon: ClipboardCheck },
            { name: 'Preventiva', path: '/manutencao/preventiva', icon: ClipboardList },
        ]
    },
    {
        id: 'frotas',
        name: 'Frotas',
        description: 'Controle de veículos e abastecimentos.',
        icon: Truck,
        color: 'from-cyan-600 to-cyan-700',
        borderColor: 'border-cyan-200',
        iconBg: 'bg-cyan-100',
        iconColor: 'text-cyan-600',
        active: true,
        path: '/frotas',
        subItems: [
            { name: 'Dashboard', path: '/frotas', icon: LayoutDashboard },
            { name: 'Veículos', path: '/frotas/veiculos', icon: Truck },
            { name: 'Abastecimentos', path: '/frotas/abastecimentos', icon: Fuel },
            { name: 'Manutenções', path: '/frotas/manutencoes', icon: Wrench },
        ]
    },
    {
        id: 'compras',
        name: 'Compras',
        description: 'Gestão de pedidos e cotações.',
        icon: ShoppingCart,
        color: 'from-amber-500 to-amber-600',
        borderColor: 'border-amber-200',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        active: true,
        path: '/compras',
        subItems: [
            { name: 'Dashboard', path: '/compras', icon: LayoutDashboard },
            { name: 'Pedidos', path: '/compras/pedidos', icon: ShoppingCart },
            { name: 'Cotações (RFQ)', path: '/compras/cotacoes', icon: FileText },
        ]
    },
    {
        id: 'projetos',
        name: 'Projetos',
        description: 'Gestão de projetos e tarefas.',
        icon: FolderKanban,
        color: 'from-teal-600 to-teal-700',
        borderColor: 'border-teal-200',
        iconBg: 'bg-teal-100',
        iconColor: 'text-teal-600',
        active: true,
        path: '/projetos/dashboard',
        subItems: [
            { name: 'Dashboard', path: '/projetos/dashboard', icon: LayoutDashboard },
            { name: 'Projetos', path: '/projetos/consulta', icon: FolderKanban },
            { name: 'Tarefas', path: '/projetos/tarefas-consulta', icon: ListTodo },
        ]
    },
    {
        id: 'seguranca',
        name: 'Segurança',
        description: 'Gestão de Acesso.',
        icon: Shield,
        color: 'from-purple-600 to-purple-700',
        borderColor: 'border-purple-200',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        active: true,
        path: '/seguranca/usuarios',
        subItems: [
            { name: 'Usuários', path: '/seguranca/usuarios', icon: Users },
            { name: 'Perfis', path: '/seguranca/perfis', icon: Shield },
            { name: 'Permissões', path: '/seguranca/permissoes', icon: Key },
        ]
    },
    {
        id: 'rh',
        name: 'RH',
        description: 'Gestão de Pessoas.',
        icon: Users,
        color: 'from-slate-500 to-slate-600',
        borderColor: 'border-slate-200',
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-500',
        active: false,
        path: '',
        subItems: []
    },
    {
        id: 'analytics',
        name: 'Analytics',
        description: 'BI Global.',
        icon: BarChart3,
        color: 'from-slate-500 to-slate-600',
        borderColor: 'border-slate-200',
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-500',
        active: false,
        path: '',
        subItems: []
    }
];
