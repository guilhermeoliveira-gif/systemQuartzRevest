import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendasService } from '../../services/vendasService';
import { useToast } from '../../contexts/ToastContext';
import { VendaCliente, VendaItem } from '../../types_vendas';
import { EstoquePA } from '../../types_estoque';
import { Search, Plus, Trash2, Save, Calendar, User, Package } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const CadastroPedido: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Estados do Cabeçalho
    const [clienteBusca, setClienteBusca] = useState('');
    const [clientesEncontrados, setClientesEncontrados] = useState<VendaCliente[]>([]);
    const [clienteSelecionado, setClienteSelecionado] = useState<VendaCliente | null>(null);
    const [dataPrevisao, setDataPrevisao] = useState(vendasService.calcularPrevisaoEntrega(3).toISOString().split('T')[0]);
    const [enderecoEntrega, setEnderecoEntrega] = useState('');
    const [observacao, setObservacao] = useState('');

    // Estados dos Itens
    const [produtoBusca, setProdutoBusca] = useState('');
    const [produtosEncontrados, setProdutosEncontrados] = useState<EstoquePA[]>([]);
    const [produtoSelecionado, setProdutoSelecionado] = useState<EstoquePA | null>(null);
    const [qtd, setQtd] = useState<number>(1);
    const [valorUnitario, setValorUnitario] = useState<number>(0); // Mockado por enquanto ou vindo do produto
    const [itens, setItens] = useState<Partial<VendaItem>[]>([]);

    // Busca Clientes
    useEffect(() => {
        if (clienteBusca.length > 2) {
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
        if (produtoBusca.length > 2) {
            const timeout = setTimeout(async () => {
                const prods = await vendasService.buscarProdutos(produtoBusca);
                setProdutosEncontrados(prods || []);
            }, 300);
            return () => clearTimeout(timeout);
        } else {
            setProdutosEncontrados([]);
        }
    }, [produtoBusca]);

    const adicionarItem = () => {
        if (!produtoSelecionado || qtd <= 0) return;

        if (itens.some(i => i.produto_id === produtoSelecionado.id)) {
            showToast('Produto já adicionado!', { type: 'warning' });
            return;
        }

        setItens([...itens, {
            produto_id: produtoSelecionado.id,
            produto: produtoSelecionado as any, // Ajuste técnico para exibição
            quantidade: qtd,
            valor_unitario: valorUnitario,
            valor_total: qtd * valorUnitario
        }]);

        // Limpar seleção de item
        setProdutoSelecionado(null);
        setProdutoBusca('');
        setQtd(1);
    };

    const removerItem = (prodId: string) => {
        setItens(itens.filter(i => i.produto_id !== prodId));
    };

    const salvarPedido = async () => {
        if (!clienteSelecionado || itens.length === 0) {
            showToast('Selecione um cliente e adicione itens.', { type: 'error' });
            return;
        }

        try {
            await vendasService.criarPedido({
                cliente_id: clienteSelecionado.id,
                data_previsao_entrega: new Date(dataPrevisao).toISOString(),
                observacao,
                endereco_entrega: enderecoEntrega,
                valor_total: itens.reduce((acc, curr) => acc + (curr.valor_total || 0), 0),
                status: 'ORCAMENTO'
            }, itens);

            showToast('Pedido criado com sucesso!', { type: 'success' });
            navigate('/vendas');
        } catch (error) {
            console.error(error);
            showToast('Erro ao salvar pedido.', { type: 'error' });
        }
    };

    // Calcular total
    const totalPedido = itens.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6 pb-24">
            <h1 className="text-2xl font-bold text-slate-800">Novo Pedido de Venda</h1>

            {/* Cabeçalho do Pedido */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Seleção de Cliente */}
                <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                className="pl-10 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Buscar Cliente..."
                                value={clienteSelecionado ? clienteSelecionado.nome : clienteBusca}
                                onChange={e => {
                                    setClienteBusca(e.target.value);
                                    setClienteSelecionado(null);
                                }}
                            />
                            {/* Dropdown de Clientes */}
                            {!clienteSelecionado && clientesEncontrados.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                                    {clientesEncontrados.map(cli => (
                                        <li
                                            key={cli.id}
                                            className="p-2 hover:bg-slate-100 cursor-pointer"
                                            onClick={() => {
                                                setClienteSelecionado(cli);
                                                setEnderecoEntrega(cli.endereco || '');
                                                setClientesEncontrados([]);
                                            }}
                                        >
                                            <div className="font-bold text-slate-800">{cli.nome}</div>
                                            <div className="text-xs text-slate-500">{cli.cnpj_cpf || 'Sem documento'}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button className="bg-slate-100 p-2 rounded-lg hover:bg-slate-200 text-slate-600">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* Data Previsão */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Previsão de Entrega</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="date"
                            className="pl-10 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={dataPrevisao}
                            onChange={e => setDataPrevisao(e.target.value)}
                        />
                    </div>
                </div>

                {/* Observação */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Endereço de Entrega</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={enderecoEntrega}
                        onChange={e => setEnderecoEntrega(e.target.value)}
                        placeholder="Endereço do Cliente"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                    <textarea
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={2}
                        value={observacao}
                        onChange={e => setObservacao(e.target.value)}
                    />
                </div>
            </div>

            {/* Inserção de Itens */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Package size={20} /> Itens do Pedido (Estoque PA)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-4">
                    {/* Busca Produto */}
                    <div className="md:col-span-6 relative">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Produto</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Buscar por código ou nome..."
                            value={produtoSelecionado ? produtoSelecionado.nome : produtoBusca}
                            onChange={e => {
                                setProdutoBusca(e.target.value);
                                setProdutoSelecionado(null);
                            }}
                        />
                        {/* Dropdown de Produtos */}
                        {!produtoSelecionado && produtosEncontrados.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                                {produtosEncontrados.map(prod => (
                                    <li
                                        key={prod.id}
                                        className="p-2 hover:bg-slate-100 cursor-pointer border-b last:border-0"
                                        onClick={() => {
                                            setProdutoSelecionado(prod);
                                            setProdutosEncontrados([]);
                                            // Mock valor unitario (futuro: pegar da tabela)
                                            setValorUnitario(100.00);
                                        }}
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-bold text-slate-800">{prod.nome}</span>
                                            <span className="text-xs bg-slate-100 px-2 rounded">{prod.codigo}</span>
                                        </div>
                                        <div className="text-xs text-slate-500">Unidade: {prod.unidade}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qtd</label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            min="1"
                            value={qtd}
                            onChange={e => setQtd(Number(e.target.value))}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Unit. (R$)</label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={valorUnitario}
                            onChange={e => setValorUnitario(Number(e.target.value))}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <button
                            onClick={adicionarItem}
                            className="w-full bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 font-bold shadow-md"
                        >
                            Adicionar
                        </button>
                    </div>
                </div>

                {/* Grid de Itens */}
                <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-3">Produto</th>
                                <th className="p-3 text-center">Unidade</th>
                                <th className="p-3 text-right">Qtd</th>
                                <th className="p-3 text-right">Unitário</th>
                                <th className="p-3 text-right">Total</th>
                                <th className="p-3 text-center">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {itens.length === 0 ? (
                                <tr><td colSpan={6} className="p-6 text-center text-slate-400">Nenhum item adicionado.</td></tr>
                            ) : itens.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="p-3">
                                        <div className="font-medium text-slate-800">{(item.produto as any)?.nome}</div>
                                        <div className="text-xs text-slate-500">Cod: {(item.produto as any)?.codigo}</div>
                                    </td>
                                    <td className="p-3 text-center">{(item.produto as any)?.unidade}</td>
                                    <td className="p-3 text-right font-mono">{item.quantidade}</td>
                                    <td className="p-3 text-right font-mono">R$ {item.valor_unitario?.toFixed(2)}</td>
                                    <td className="p-3 text-right font-bold text-slate-700">R$ {item.valor_total?.toFixed(2)}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => removerItem(item.produto_id!)} className="text-red-500 hover:text-red-700">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold text-slate-800">
                            <tr>
                                <td colSpan={4} className="p-3 text-right uppercase text-xs text-slate-500">Total Pedido</td>
                                <td className="p-3 text-right text-lg">R$ {totalPedido.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Footer Fixo */}
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t shadow-lg flex justify-end gap-4 z-10 md:pl-64">
                <button onClick={() => navigate('/vendas')} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button
                    onClick={salvarPedido}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-200"
                >
                    <Save size={20} /> Salvar Pedido
                </button>
            </div>
        </div>
    );
};

export default CadastroPedido;
