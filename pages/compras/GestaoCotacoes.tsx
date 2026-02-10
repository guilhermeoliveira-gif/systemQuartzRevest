import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, ArrowLeft, Calendar } from 'lucide-react';
import { comprasService } from '../../services/comprasService';
import { Cotacao } from '../../types_compras';
import { LoadingState } from '../../components/LoadingState';

export const GestaoCotacoes: React.FC = () => {
    const navigate = useNavigate();
    const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCotacoes();
    }, []);

    const fetchCotacoes = async () => {
        try {
            setLoading(true);
            const data = await comprasService.getCotacoes();
            setCotacoes(data as any);
        } catch (err) {
            console.error('Erro ao buscar cotações:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'RASCUNHO': return 'bg-slate-100 text-slate-700';
            case 'ABERTA': return 'bg-blue-100 text-blue-700';
            case 'ANALISE': return 'bg-amber-100 text-amber-700';
            case 'FECHADA': return 'bg-purple-100 text-purple-700';
            case 'CONCLUIDA': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredCotacoes = cotacoes.filter(c =>
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingState />;

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/compras')} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Cotações</h1>
                    <p className="text-slate-500">Gerencie solicitações de cotação e acompanhe respostas.</p>
                </div>
                <div className="ml-auto">
                    <button
                        onClick={() => navigate('/compras/cotacoes/nova')}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 transition-colors font-medium shadow-md shadow-amber-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Cotação (RFQ)
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar cotações..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Título</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Convites</th>
                                <th className="px-6 py-4">Respostas</th>
                                <th className="px-6 py-4">Prazo</th>
                                <th className="px-6 py-4">Criado em</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCotacoes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        Nenhuma cotação encontrada.
                                    </td>
                                </tr>
                            ) : (
                                filteredCotacoes.map((cotacao) => (
                                    <tr key={cotacao.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{cotacao.titulo}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cotacao.status)}`}>
                                                {cotacao.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {(cotacao.fornecedores?.length || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {(cotacao.propostas?.length || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {cotacao.prazo_resposta ? new Date(cotacao.prazo_resposta).toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(cotacao.created_at || '').toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/compras/cotacoes/${cotacao.id}`)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-xs font-medium"
                                            >
                                                <Eye className="w-3 h-3" />
                                                Ver Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GestaoCotacoes;
