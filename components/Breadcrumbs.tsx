import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

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
            'nao-conformidades': 'Não Conformidades',
            'planos-acao': 'Planos de Ação',
            tarefas: 'Tarefas',
            usuarios: 'Usuários',
            configuracoes: 'Configurações',
            'minhas-tarefas': 'Minhas Tarefas'
        };
        return labels[path] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    };

    return (
        <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-6 bg-white w-fit px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <Link
                to="/"
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
            >
                <Home size={14} />
                <span className="font-medium">Início</span>
            </Link>

            {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;

                return (
                    <React.Fragment key={to}>
                        <ChevronRight size={14} className="text-slate-300" />
                        {last ? (
                            <span className="font-bold text-slate-800">{getLabel(value)}</span>
                        ) : (
                            <Link
                                to={to}
                                className="hover:text-indigo-600 transition-colors font-medium"
                            >
                                {getLabel(value)}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
