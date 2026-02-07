import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, FolderKanban, CheckSquare, Package, User, ArrowRight } from 'lucide-react';
import { buscaService, ResultadoBusca } from '../services/buscaService';

const GlobalSearch: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Atalho Ctrl+K / Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus no input quando abrir
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Buscar quando query mudar
    useEffect(() => {
        const buscar = async () => {
            if (query.length < 2) {
                setResultados([]);
                return;
            }

            setLoading(true);
            try {
                const results = await buscaService.buscarGlobal(query);
                setResultados(results);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Erro na busca:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(buscar, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    // Navegação por teclado
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, resultados.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && resultados[selectedIndex]) {
                e.preventDefault();
                handleSelect(resultados[selectedIndex]);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, resultados, selectedIndex]);

    const handleSelect = (resultado: ResultadoBusca) => {
        navigate(resultado.link);
        setIsOpen(false);
        setQuery('');
        setResultados([]);
    };

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'NC': return <FileText size={18} className="text-red-600" />;
            case 'PROJETO': return <FolderKanban size={18} className="text-teal-600" />;
            case 'TAREFA': return <CheckSquare size={18} className="text-blue-600" />;
            case 'MATERIAL': return <Package size={18} className="text-orange-600" />;
            case 'USUARIO': return <User size={18} className="text-purple-600" />;
            default: return <Search size={18} />;
        }
    };

    const getTipoLabel = (tipo: string) => {
        const labels: Record<string, string> = {
            'NC': 'Não Conformidade',
            'PROJETO': 'Projeto',
            'TAREFA': 'Tarefa',
            'MATERIAL': 'Material',
            'USUARIO': 'Usuário'
        };
        return labels[tipo] || tipo;
    };

    const getTipoColor = (tipo: string) => {
        const colors: Record<string, string> = {
            'NC': 'bg-red-100 text-red-700',
            'PROJETO': 'bg-teal-100 text-teal-700',
            'TAREFA': 'bg-blue-100 text-blue-700',
            'MATERIAL': 'bg-orange-100 text-orange-700',
            'USUARIO': 'bg-purple-100 text-purple-700'
        };
        return colors[tipo] || 'bg-slate-100 text-slate-700';
    };

    // Agrupar resultados por tipo
    const resultadosAgrupados = resultados.reduce((acc, resultado) => {
        if (!acc[resultado.tipo]) {
            acc[resultado.tipo] = [];
        }
        acc[resultado.tipo].push(resultado);
        return acc;
    }, {} as Record<string, ResultadoBusca[]>);

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101] px-4">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                    {/* Header com Input */}
                    <div className="p-4 border-b border-slate-200">
                        <div className="relative">
                            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Buscar em NCs, Projetos, Tarefas, Materiais, Usuários..."
                                className="w-full pl-11 pr-10 py-3 text-lg outline-none"
                            />
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                            <span>Digite para buscar...</span>
                            <div className="flex gap-2">
                                <kbd className="px-2 py-0.5 bg-slate-100 rounded border border-slate-300">↑↓</kbd>
                                <span>Navegar</span>
                                <kbd className="px-2 py-0.5 bg-slate-100 rounded border border-slate-300">Enter</kbd>
                                <span>Selecionar</span>
                                <kbd className="px-2 py-0.5 bg-slate-100 rounded border border-slate-300">Esc</kbd>
                                <span>Fechar</span>
                            </div>
                        </div>
                    </div>

                    {/* Resultados */}
                    <div className="max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400">
                                <Search size={32} className="mx-auto mb-2 animate-pulse" />
                                <p>Buscando...</p>
                            </div>
                        ) : query.length < 2 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Search size={48} className="mx-auto mb-2 opacity-50" />
                                <p className="font-medium">Digite pelo menos 2 caracteres</p>
                                <p className="text-xs mt-1">Use Ctrl+K para abrir a busca</p>
                            </div>
                        ) : resultados.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Search size={48} className="mx-auto mb-2 opacity-50" />
                                <p className="font-medium">Nenhum resultado encontrado</p>
                                <p className="text-xs mt-1">Tente buscar por outro termo</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {(Object.entries(resultadosAgrupados) as [string, ResultadoBusca[]][]).map(([tipo, items]) => (
                                    <div key={tipo} className="p-2">
                                        <h3 className="px-3 py-2 text-xs font-bold text-slate-500 uppercase">
                                            {getTipoLabel(tipo)} ({items.length})
                                        </h3>
                                        {items.map((resultado, index) => {
                                            const globalIndex = resultados.indexOf(resultado);
                                            const isSelected = globalIndex === selectedIndex;

                                            return (
                                                <button
                                                    key={resultado.id}
                                                    onClick={() => handleSelect(resultado)}
                                                    className={`w-full px-3 py-3 rounded-lg text-left flex items-center gap-3 transition ${isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="flex-shrink-0">
                                                        {getIcon(resultado.tipo)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getTipoColor(resultado.tipo)}`}>
                                                                {getTipoLabel(resultado.tipo)}
                                                            </span>
                                                        </div>
                                                        <p className="font-semibold text-slate-800 truncate">
                                                            {resultado.titulo}
                                                        </p>
                                                        {resultado.subtitulo && (
                                                            <p className="text-xs text-slate-500 truncate">
                                                                {resultado.subtitulo}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <ArrowRight size={16} className="text-slate-400 flex-shrink-0" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default GlobalSearch;
