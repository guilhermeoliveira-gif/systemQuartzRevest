import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { expedicaoService } from '../../services/expedicaoService';
import { vendasService } from '../../services/vendasService'; // Reutilizar busca
import { supabase } from '../../services/supabaseClient';
import { Save, CheckCircle, Search, Clock, Archive } from 'lucide-react';
import { VendaCliente } from '../../types_vendas';
import { EstoquePA } from '../../types_estoque';

const GestaoPendencias: React.FC = () => {
    const { showToast } = useToast();
    const [pendencias, setPendencias] = useState<any[]>([]);
    const [mostrarTodas, setMostrarTodas] = useState(false);
    const [loading, setLoading] = useState(false);

    // Formulário
    const [clienteBusca, setClienteBusca] = useState('');
    const [clientesEncontrados, setClientesEncontrados] = useState<VendaCliente[]>([]);
    const [clienteSelecionado, setClienteSelecionado] = useState<VendaCliente | null>(null);

    const [produtoBusca, setProdutoBusca] = useState('');
    const [produtosEncontrados, setProdutosEncontrados] = useState<EstoquePA[]>([]);
    const [produtoSelecionado, setProdutoSelecionado] = useState<EstoquePA | null>(null);

    const [qtd, setQtd] = useState<string>('');
    const [observacao, setObservacao] = useState('');

    useEffect(() => {
        carregarPendencias();
    }, [mostrarTodas]);

    // Busca Clientes
    useEffect(() => {
        if (clienteBusca.length > 2 && !clienteSelecionado) {
            const timeout = setTimeout(async () => {
                const { data } = await supabase.from('vendas_cliente').select('*').ilike('nome', `%${clienteBusca}%`).limit(5);
                setClientesEncontrados(data || []);
            }, 300);
            return () => clearTimeout(timeout);
        } else {
            setClientesEncontrados([]);
        }
    }, [clienteBusca]);

    // Busca Produtos
    useEffect(() => {
        if (produtoBusca.length > 2 && !produtoSelecionado) {
            const timeout = setTimeout(async () => {
                const prods = await vendasService.buscarProdutos(produtoBusca);
                setProdutosEncontrados(prods || []);
            }, 300);
            return () => clearTimeout(timeout);
        } else {
            setProdutosEncontrados([]);
        }
    }, [produtoBusca]);

    const carregarPendencias = async () => {
        setLoading(true);
        try {
            const data = await expedicaoService.listarPendencias(mostrarTodas);
            setPendencias(data || []);
        } catch (error) {
            console.error(error);
            showToast('error', 'Erro ao carregar pendências');
        } finally {
            setLoading(false);
        }
    };

    const salvarPendencia = async () => {
        if (!clienteSelecionado || !produtoSelecionado || !qtd) {
            showToast('warning', 'Preencha Cliente, Produto e Quantidade');
            return;
        }

        try {
            await expedicaoService.criarPendencia({
                cliente_id: clienteSelecionado.id,
                produto_id: produtoSelecionado.id,
                quantidade: Number(qtd),
                observacao
            });
            showToast('success', 'Pendência registrada!');

            // Limpar form
            setClienteSelecionado(null);
            setClienteBusca('');
            setProdutoSelecionado(null);
            setProdutoBusca('');
            setQtd('');
            setObservacao('');

            carregarPendencias();
        } catch (error) {
            console.error(error);
            showToast('error', 'Erro ao salvar pendência');
        }
    };

    const resolver = async (id: string) => {
        if (!window.confirm('Marcar pendência como resolvida?')) return;
        try {
            await expedicaoService.resolverPendencia(id);
            showToast('success', 'Pendência resolvida!');
            carregarPendencias();
        } catch (error) {
            console.error(error);
            showToast('error', 'Erro ao resolver');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Gestão de Pendências de Entrega</h1>

            {/* Formulário de Inserção */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-orange-500" /> Nova Pendência
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    {/* Cliente */}
                    <div className="relative md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Buscar Cliente..."
                            value={clienteBusca}
                            onChange={e => {
                                setClienteBusca(e.target.value);
                                setClienteSelecionado(null);
                            }}
                        />
                        {/* Dropdown Clientes */}
                        {!clienteSelecionado && clientesEncontrados.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                                {clientesEncontrados.map(cli => (
                                    <li key={cli.id} className="p-2 hover:bg-slate-100 cursor-pointer"
                                        onClick={() => {
                                            setClienteSelecionado(cli);
                                            setClienteBusca(cli.nome);
                                            setClientesEncontrados([]);
                                        }}>
                                        <div className="font-bold text-slate-800">{cli.nome}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Produto */}
                    <div className="relative md:col-span-2 lg:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Produto</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Buscar Produto..."
                            value={produtoBusca}
                            onChange={e => {
                                setProdutoBusca(e.target.value);
                                setProdutoSelecionado(null);
                            }}
                        />
                        {/* Dropdown Produtos */}
                        {!produtoSelecionado && produtosEncontrados.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                                {produtosEncontrados.map(prod => (
                                    <li key={prod.id} className="p-2 hover:bg-slate-100 cursor-pointer"
                                        onClick={() => {
                                            setProdutoSelecionado(prod);
                                            setProdutoBusca(prod.descricao); // descricao mapeada do service
                                            setProdutosEncontrados([]);
                                        }}>
                                        <div className="font-bold text-slate-800">{prod.descricao}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Quantidade */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantidade</label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            value={qtd}
                            onChange={e => setQtd(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        onClick={salvarPendencia}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-md"
                    >
                        <Save size={18} /> Salvar Pendência
                    </button>
                </div>
            </div>

            {/* Listagem */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2">
                        Lista de Pendências
                    </h2>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600">
                        <input
                            type="checkbox"
                            checked={mostrarTodas}
                            onChange={e => setMostrarTodas(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        Mostrar Todas
                    </label>
                </div>

                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 font-bold text-slate-600 uppercase text-xs">
                        <tr>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Produto</th>
                            <th className="p-4 text-right">Qtd</th>
                            <th className="p-4 text-center">Data Resolvida</th>
                            <th className="p-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center">Carregando...</td></tr>
                        ) : pendencias.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma pendência encontrada.</td></tr>
                        ) : pendencias.map((pen) => (
                            <tr key={pen.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-medium text-slate-800">{pen.cliente?.nome}</td>
                                <td className="p-4 text-slate-600">
                                    <div className="font-bold">{pen.produto?.nome}</div>
                                    <div className="text-xs text-slate-400">Cod: {(pen.produto as any)?.codigo || pen.produto?.id.split('-')[0]}</div>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-slate-700">{pen.quantidade}</td>
                                <td className="p-4 text-center">
                                    {pen.data_resolvida ? (
                                        <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded-full">
                                            {new Date(pen.data_resolvida).toLocaleDateString()}
                                        </span>
                                    ) : (
                                        <span className="text-orange-500 font-bold text-xs bg-orange-100 px-2 py-1 rounded-full">PENDENTE</span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    {!pen.data_resolvida && (
                                        <button
                                            onClick={() => resolver(pen.id)}
                                            className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-xs font-bold shadow transition-all"
                                        >
                                            Finalizar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GestaoPendencias;
