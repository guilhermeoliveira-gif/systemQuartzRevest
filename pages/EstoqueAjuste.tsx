import React, { useState, useEffect } from 'react';
import { RefreshCcw, Search, AlertTriangle, CheckCircle2, Package, Wrench, ArrowRight } from 'lucide-react';
import { estoqueService } from '../services/estoqueService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LoadingState } from '../components/LoadingState';

const EstoqueAjuste: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Categorias e Itens
    const [categoria, setCategoria] = useState<'MATERIA_PRIMA' | 'PRODUTO_ACABADO' | 'PECA'>('MATERIA_PRIMA');
    const [itens, setItens] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Seleção e Ajuste
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [novaQuantidade, setNovaQuantidade] = useState<string>('');
    const [motivo, setMotivo] = useState('');

    useEffect(() => {
        loadItens();
    }, [categoria]);

    const loadItens = async () => {
        try {
            setLoading(true);
            let data: any[] = [];
            if (categoria === 'MATERIA_PRIMA') data = await estoqueService.getMateriasPrimas();
            else if (categoria === 'PRODUTO_ACABADO') data = await estoqueService.getProdutosAcabados();
            else if (categoria === 'PECA') data = await estoqueService.getPecasInsumos();

            setItens(data);
            setSelectedItem(null);
            setNovaQuantidade('');
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Falha ao carregar itens.');
        } finally {
            setLoading(false);
        }
    };

    const handleAjustar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || !novaQuantidade || !motivo) return;

        try {
            setSubmitting(true);
            await estoqueService.createAjusteEstoque({
                tipo_item: categoria,
                item_id: selectedItem.id,
                item_nome: selectedItem.nome,
                quantidade_anterior: selectedItem.estoque_atual || selectedItem.quantidade_atual || 0,
                quantidade_nova: parseFloat(novaQuantidade),
                motivo: motivo,
                responsavel_id: user?.id || ''
            });

            toast.success('Sucesso', 'Ajuste de estoque realizado com sucesso!');
            setSelectedItem(null);
            setNovaQuantidade('');
            setMotivo('');
            loadItens();
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Falha ao realizar ajuste de estoque.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItens = itens.filter(i => i.nome.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                    <RefreshCcw className="text-teal-600" size={32} />
                    Ajuste de Estoque Puntual
                </h1>
                <p className="text-slate-500 font-medium tracking-tight">Corrija divergências individuais com justificativa obrigatória</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seleção de Item */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                        {(['MATERIA_PRIMA', 'PRODUTO_ACABADO', 'PECA'] as const).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoria(cat)}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all ${categoria === cat ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {cat.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar item..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="max-height-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-8 text-slate-400 animate-pulse font-bold">Carregando itens...</div>
                        ) : filteredItens.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${selectedItem?.id === item.id ? 'border-teal-500 bg-teal-50/50' : 'border-slate-100 hover:border-teal-200 active:scale-[0.98]'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${categoria === 'PECA' ? 'bg-orange-100' : 'bg-teal-100'}`}>
                                        {categoria === 'PECA' ? <Wrench size={16} className="text-orange-600" /> : <Package size={16} className="text-teal-600" />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.nome}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Saldo: {item.estoque_atual || item.quantidade_atual || 0} {item.unidade_medida || 'UN'}</div>
                                    </div>
                                </div>
                                <ArrowRight size={16} className={`text-teal-500 transition-transform ${selectedItem?.id === item.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Formulário de Ajuste */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                    {!selectedItem ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <ArrowRight size={40} className="text-slate-300 mb-2 -rotate-90 md:rotate-0" />
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Selecione um item à esquerda para ajustar</p>
                        </div>
                    ) : (
                        <form onSubmit={handleAjustar} className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-teal-50 rounded-2xl border border-teal-100">
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <Package className="text-teal-600" size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none mb-1">Item Selecionado</div>
                                    <div className="text-lg font-black text-slate-800 uppercase truncate max-w-[200px]">{selectedItem.nome}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Atual</div>
                                    <div className="text-2xl font-black text-slate-700">{selectedItem.estoque_atual || selectedItem.quantidade_atual || 0}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">{selectedItem.unidade_medida || 'UN'}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Novo Saldo</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        className="w-full text-2xl font-black p-4 bg-white border border-slate-200 rounded-2xl focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                        placeholder="0.00"
                                        value={novaQuantidade}
                                        onChange={(e) => setNovaQuantidade(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Motivo / Justificativa</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-700"
                                    placeholder="Ex: Item avariado na movimentação, correção de erro de entrada..."
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                />
                            </div>

                            {parseFloat(novaQuantidade) !== (selectedItem.estoque_atual || selectedItem.quantidade_atual || 0) && (
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                                    <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                        Uma variação superior a 10% gerará automaticamente uma <strong>Não Conformidade</strong> para análise da diretoria.
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || !novaQuantidade || !motivo}
                                className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {submitting ? <RefreshCcw size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}
                                Confirmar Ajuste
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EstoqueAjuste;
