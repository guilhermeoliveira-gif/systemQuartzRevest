import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, DollarSign, CheckCircle2, XCircle, Plus, FileText } from 'lucide-react';
import { comprasService } from '../../services/comprasService';
import { Cotacao, PropostaCotacao } from '../../types_compras';
import { LoadingState } from '../../components/LoadingState';

const DetalheCotacao: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [cotacao, setCotacao] = useState<Cotacao | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'ITENS' | 'PROPOSTAS'>('PROPOSTAS');
    const [showPropostaForm, setShowPropostaForm] = useState(false);

    // Form States
    const [fornecedorNome, setFornecedorNome] = useState('');
    const [valorTotal, setValorTotal] = useState('');
    const [itemPrecos, setItemPrecos] = useState<{ [itemId: string]: number }>({});

    useEffect(() => {
        if (id) fetchCotacao(id);
    }, [id]);

    const fetchCotacao = async (cotacaoId: string) => {
        try {
            setLoading(true);
            const data = await comprasService.getCotacaoById(cotacaoId);
            setCotacao(data as any);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProposta = async () => {
        if (!cotacao || !fornecedorNome || !valorTotal) return alert('Preencha os dados');

        try {
            // Create temporary supplier or select existing (Simplified for MVP: create on fly or assume ID is passed if select used)
            // But we don't have Supplier Select in this MVP form, just Name input.
            // Ideally we should have Supplier Select. Let's assume we create one or user selects.
            // For now, I'll restrict to needing a real supplier ID.
            // I'll skip creating supplier logic here to keep it simple and assume user must pick one. 
            // Wait, I didn't implement Supplier Select in the form below. I'll add a simple text input for now and create a dummy supplier or fail.
            // BETTER: Use `createFornecedor` if checks fail.
            // To save time, I will just alert "Select Supplier" and provide a list if implemented, else just text input -> create supplier.

            // Let's implement a quick "Create Supplier" on the fly for the prototype.
            const newFornecedor = await comprasService.createFornecedor({
                nome: fornecedorNome,
                status: 'ATIVO'
            } as any);

            const itemsPayload = cotacao.itens?.map(item => ({
                item_cotacao_id: item.id,
                preco_unitario: itemPrecos[item.id] || 0,
                quantidade: item.quantidade
            })) || [];

            await comprasService.registrarProposta(cotacao.id, newFornecedor.id, Number(valorTotal), itemsPayload);

            setShowPropostaForm(false);
            fetchCotacao(cotacao.id);
            setFornecedorNome('');
            setValorTotal('');
            setItemPrecos({});
        } catch (error) {
            console.error(error);
            alert('Erro ao registrar proposta');
        }
    };

    const handleMarcarVencedora = async (propostaId: string) => {
        if (!cotacao || !confirm('Confirmar esta proposta como vencedora?')) return;
        try {
            await comprasService.marcarVencedora(propostaId);
            fetchCotacao(cotacao.id);
        } catch (error) {
            console.error(error);
            alert('Erro ao marcar vencedora');
        }
    };

    if (loading) return <LoadingState />;
    if (!cotacao) return <div>Cotação não encontrada</div>;

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/compras/cotacoes')} className="p-2 hover:bg-slate-200 rounded-lg">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{cotacao.titulo}</h1>
                        <span className="text-sm text-slate-500">
                            Criado em {new Date(cotacao.created_at || '').toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                    <div className="ml-auto flex gap-2">
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            {cotacao.status}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setTab('PROPOSTAS')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'PROPOSTAS' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Propostas Recebidas
                    </button>
                    <button
                        onClick={() => setTab('ITENS')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'ITENS' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Itens Solicitados
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[400px] p-6">
                    {tab === 'ITENS' && (
                        <div className="space-y-4">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-2">Item</th>
                                        <th className="px-4 py-2">Qtd</th>
                                        <th className="px-4 py-2">Unidade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {cotacao.itens?.map(item => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3">{item.descricao}</td>
                                            <td className="px-4 py-3">{item.quantidade}</td>
                                            <td className="px-4 py-3">{item.unidade}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {tab === 'PROPOSTAS' && (
                        <div>
                            {showPropostaForm ? (
                                <div className="max-w-2xl mx-auto space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                                    <h3 className="text-lg font-bold mb-4">Registrar Nova Proposta</h3>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nome do Fornecedor</label>
                                        <input
                                            type="text"
                                            value={fornecedorNome}
                                            onChange={(e) => setFornecedorNome(e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg"
                                            placeholder="Ex: Fornecedor ABC Ltda"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Valor Total Proposta (R$)</label>
                                        <input
                                            type="number"
                                            value={valorTotal}
                                            onChange={(e) => setValorTotal(e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg"
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="font-medium text-sm mb-2">Preços por Item (Opcional)</h4>
                                        {cotacao.itens?.map(item => (
                                            <div key={item.id} className="flex items-center gap-4 mb-2">
                                                <span className="text-sm flex-1">{item.descricao} ({item.quantidade} {item.unidade})</span>
                                                <input
                                                    type="number"
                                                    className="w-32 p-1.5 border border-slate-200 rounded text-sm"
                                                    placeholder="Preço Unit."
                                                    onChange={(e) => setItemPrecos({ ...itemPrecos, [item.id]: Number(e.target.value) })}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4">
                                        <button
                                            onClick={() => setShowPropostaForm(false)}
                                            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleAddProposta}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            Salvar Proposta
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-slate-800">Propostas ({cotacao.propostas?.length || 0})</h3>
                                        <button
                                            onClick={() => setShowPropostaForm(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Registrar Proposta
                                        </button>
                                    </div>

                                    {(!cotacao.propostas || cotacao.propostas.length === 0) ? (
                                        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                                            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                                            <p>Nenhuma proposta registrada ainda.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {cotacao.propostas.map((proposta) => (
                                                <div key={proposta.id} className={`border rounded-xl p-4 transition-all hover:shadow-md ${proposta.is_vencedora ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white'}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-slate-900">{proposta.fornecedor?.nome || 'Fornecedor Desconhecido'}</h4>
                                                        {proposta.is_vencedora && (
                                                            <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                                                <CheckCircle2 className="w-3 h-3" /> Vencedora
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-2xl font-bold text-slate-800 mb-4">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposta.valor_total || 0)}
                                                    </div>
                                                    <div className="flex gap-2 text-sm">
                                                        {!proposta.is_vencedora && (
                                                            <button
                                                                onClick={() => handleMarcarVencedora(proposta.id)}
                                                                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-green-100 hover:text-green-700 rounded-lg font-medium transition-colors"
                                                            >
                                                                Marcar como Vencedora
                                                            </button>
                                                        )}
                                                        <button className="px-3 py-2 text-slate-400 hover:text-slate-600">
                                                            Detalhes
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetalheCotacao;
