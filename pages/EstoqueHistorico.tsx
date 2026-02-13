import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ArrowUpRight, ArrowDownLeft, RefreshCcw, Package, Wrench, FileText, Calendar } from 'lucide-react';
import { estoqueService } from '../services/estoqueService';
import { LoadingState } from '../components/LoadingState';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EstoqueHistorico: React.FC = () => {
    const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState('ALL');
    const [movFiltro, setMovFiltro] = useState('ALL');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await estoqueService.getHistoricoMovimentacoes();
            setMovimentacoes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = movimentacoes.filter(m => {
        const matchesSearch = m.item_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.documento && m.documento.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesTipo = tipoFiltro === 'ALL' || m.tipo_item === tipoFiltro;
        const matchesMov = movFiltro === 'ALL' || m.tipo_movimentacao === movFiltro;
        return matchesSearch && matchesTipo && matchesMov;
    });

    if (loading) return <LoadingState message="Carregando histórico..." />;

    const getMovIcon = (tipo: string) => {
        switch (tipo) {
            case 'ENTRADA': return <ArrowUpRight className="text-green-500" size={20} />;
            case 'SAIDA': return <ArrowDownLeft className="text-red-500" size={20} />;
            case 'AJUSTE': return <RefreshCcw className="text-amber-500" size={20} />;
            case 'PRODUCAO': return <Package className="text-blue-500" size={20} />;
            default: return <FileText className="text-slate-400" size={20} />;
        }
    };

    const getItemIcon = (tipo: string) => {
        switch (tipo) {
            case 'MATERIA_PRIMA': return <Package className="text-teal-600" size={18} />;
            case 'PRODUTO_ACABADO': return <Package className="text-blue-600" size={18} />;
            case 'PECA': return <Wrench className="text-orange-600" size={18} />;
            default: return <Package className="text-slate-400" size={18} />;
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                        <History className="text-teal-600" size={32} />
                        Histórico de Movimentações
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Rastreabilidade completa de todas as alterações de estoque</p>
                </div>
                <button
                    onClick={loadData}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    title="Atualizar"
                >
                    <RefreshCcw size={20} className="text-slate-600" />
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por item ou documento..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-teal-500 outline-none transition-all font-medium text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-teal-500 outline-none transition-all font-bold text-slate-600 appearance-none min-w-[150px]"
                        value={tipoFiltro}
                        onChange={(e) => setTipoFiltro(e.target.value)}
                    >
                        <option value="ALL">Todos Tipos</option>
                        <option value="MATERIA_PRIMA">Matéria-Prima</option>
                        <option value="PRODUTO_ACABADO">Produto Acabado</option>
                        <option value="PECA">Peças/Insumos</option>
                    </select>
                    <select
                        className="px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-teal-500 outline-none transition-all font-bold text-slate-600 appearance-none min-w-[150px]"
                        value={movFiltro}
                        onChange={(e) => setMovFiltro(e.target.value)}
                    >
                        <option value="ALL">Todas Movimentações</option>
                        <option value="ENTRADA">Entrada</option>
                        <option value="SAIDA">Saída</option>
                        <option value="AJUSTE">Ajuste</option>
                        <option value="PRODUCAO">Produção</option>
                    </select>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Data/Hora</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Item</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Movimento</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Anterior</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Novo</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Doc/Motivo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-slate-700">
                                        {format(new Date(m.created_at), 'dd/MM/yyyy')}
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium">
                                        {format(new Date(m.created_at), 'HH:mm:ss')}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            {getItemIcon(m.tipo_item)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{m.item_nome}</div>
                                            <div className="text-[10px] font-bold text-slate-400">{m.tipo_item.replace('_', ' ')}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {getMovIcon(m.tipo_movimentacao)}
                                        <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">
                                            {m.tipo_movimentacao}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-sm font-black ${m.quantidade > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {m.quantidade > 0 ? '+' : ''}{m.quantidade}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium text-slate-500">
                                    {m.estoque_anterior}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-black text-slate-800">
                                    {m.estoque_novo}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs font-bold text-slate-700 truncate max-w-[200px]" title={m.motivo}>
                                        {m.documento ? `DOC: ${m.documento}` : m.motivo || '-'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {filteredData.map((m) => (
                    <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    {getItemIcon(m.tipo_item)}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm">{m.item_nome}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                        <Calendar size={10} />
                                        {format(new Date(m.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1">
                                    {getMovIcon(m.tipo_movimentacao)}
                                    <span className="text-[10px] font-black text-slate-600 uppercase">{m.tipo_movimentacao}</span>
                                </div>
                                <span className={`text-lg font-black ${m.quantidade > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {m.quantidade > 0 ? '+' : ''}{m.quantidade}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase block">Anterior</span>
                                <span className="text-sm font-bold text-slate-600">{m.estoque_anterior}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase block">Novo Saldo</span>
                                <span className="text-sm font-black text-slate-800">{m.estoque_novo}</span>
                            </div>
                        </div>
                        {m.motivo && (
                            <div className="bg-slate-50 p-2 rounded-lg text-xs font-medium text-slate-600 italic">
                                "{m.motivo}"
                            </div>
                        )}
                        {m.documento && (
                            <div className="text-[10px] font-black text-slate-400 uppercase">
                                Documento: <span className="text-slate-700">{m.documento}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredData.length === 0 && (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                    <History size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-black text-slate-800 mb-1">Nenhuma movimentação</h3>
                    <p className="text-slate-500 font-medium">Não encontramos registros para os filtros selecionados.</p>
                </div>
            )}
        </div>
    );
};

export default EstoqueHistorico;
