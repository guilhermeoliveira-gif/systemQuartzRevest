import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, Box, AlertTriangle, FolderKanban, Factory, Wrench } from 'lucide-react';

const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) return null;

    const getLabel = (path: string) => {
        const labels: Record<string, string> = {
            estoque: 'Estoque',
            qualidade: 'Qualidade',
            projetos: 'Projetos',
            dashboard: 'Dashboard',
            cadastro: 'Cadastro',
            pcp: 'PCP',
            manutencao: 'Manutenção',
            'nao-conformidades': 'Não Conformidades',
            'planos-acao': 'Planos de Ação',
            historico: 'Histórico',
            ajuste: 'Ajuste de Estoque',
            'alertas-config': 'Configuração de Alertas',
            tarefas: 'Tarefas',
            usuarios: 'Usuários',
            configuracoes: 'Configurações',
            'minhas-tarefas': 'Minhas Tarefas'
        };
        return labels[path] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    };

    const getIcon = (path: string) => {
        switch (path) {
            case 'estoque': return <Box size={14} />;
            case 'qualidade': return <AlertTriangle size={14} />;
            case 'projetos': return <FolderKanban size={14} />;
            case 'pcp': return <Factory size={14} />;
            case 'manutencao': return <Wrench size={14} />;
            default: return null;
        }
    };

    return (
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 bg-white w-fit px-4 py-2 rounded-lg border border-slate-200 shadow-sm overflow-hidden min-h-[40px]">
            <Link
                to="/"
                className="flex items-center gap-1.5 hover:text-blue-600 transition-colors shrink-0"
            >
                <Home size={14} className="text-slate-400" />
                <span className="font-medium text-slate-600">Início</span>
            </Link>

            {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const icon = getIcon(value);

                return (
                    <div key={to} className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-slate-300 shrink-0" />
                        {last ? (
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 h-full">
                                {icon && <span className="text-slate-400 flex items-center">{icon}</span>}
                                <span className="truncate max-w-[200px] leading-tight">{getLabel(value)}</span>
                            </div>
                        ) : (
                            <Link
                                to={to}
                                className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-medium whitespace-nowrap text-slate-600"
                            >
                                {icon && <span className="opacity-70 flex items-center">{icon}</span>}
                                {getLabel(value)}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
