import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCcw, Save, Package, Wrench, BellOff, BellRing } from 'lucide-react';
import { estoqueService } from '../services/estoqueService';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { LoadingState } from '../components/LoadingState';

const EstoqueConfig: React.FC = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Categorias e Itens
    const [categoria, setCategoria] = useState<'MATERIA_PRIMA' | 'PRODUTO_ACABADO'>('MATERIA_PRIMA');
    const [itens, setItens] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, [categoria]);

    const loadData = async () => {
        try {
            setLoading(true);
            let data: any[] = [];
            if (categoria === 'MATERIA_PRIMA') data = await estoqueService.getMateriasPrimas();
            else if (categoria === 'PRODUTO_ACABADO') data = await estoqueService.getProdutosAcabados();

            setItens(data);
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Falha ao carregar itens.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateMinimo = async (id: string, value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;

        setItens(prev => prev.map(item =>
            item.id === id ? { ...item, estoque_minimo: numValue } : item
        ));
    };

    const handleToggleAlerta = (id: string) => {
        setItens(prev => prev.map(item =>
            item.id === id ? { ...item, alerta_ativo: !item.alerta_ativo } : item
        ));
    };

    const handleSaveAll = async () => {
        try {
            setSubmitting(true);
            const table = categoria === 'MATERIA_PRIMA' ? 'materia_prima' : 'produto_acabado';

            // Em Supabase, updates em massa costumam ser feitos um a um ou via RPC.
            // Aqui faremos individualmente para simplicidade, mas o ideal seria um rpc
            for (const item of itens) {
                await supabase
                    .from(table)
                    .update({
                        estoque_minimo: item.estoque_minimo || 0,
                        alerta_ativo: item.alerta_ativo
                    })
                    .eq('id', item.id);
            }

            toast.success('Sucesso', 'Configurações de alerta salvas!');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Falha ao salvar configurações.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItens = itens.filter(i => i.nome.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <LoadingState message="Carregando configurações..." />;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                        <ShieldAlert className="text-orange-500" size={32} />
                        Configuração de Estoque Mínimo
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Defina os gatilhos de alerta para compras e produção</p>
                </div>
                <button
                    onClick={handleSaveAll}
                    disabled={submitting}
                    className="bg-teal-600 text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50"
                >
                    {submitting ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
                    Salvar Todas Alterações
                </button>
            </div>

            {/* Quick Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                        onClick={() => setCategoria('MATERIA_PRIMA')}
                        className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${categoria === 'MATERIA_PRIMA' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Matéria-Prima
                    </button>
                    <button
                        onClick={() => setCategoria('PRODUTO_ACABADO')}
                        className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${categoria === 'PRODUTO_ACABADO' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Produto Acabado
                    </button>
                </div>
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar item..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-teal-500 transition-all font-medium text-slate-700 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid de Itens */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItens.map(item => (
                    <div key={item.id} className={`bg-white p-5 rounded-2xl border transition-all shadow-sm flex flex-col justify-between ${item.alerta_ativo ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <Package size={24} className="text-slate-400" />
                                </div>
                                <div className="max-w-[150px]">
                                    <h3 className="text-sm font-black text-slate-800 uppercase truncate" title={item.nome}>{item.nome}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Saldo: {item.estoque_atual || item.quantidade_atual || 0} {item.unidade_medida || (categoria === 'MATERIA_PRIMA' ? 'KG' : 'UN')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggleAlerta(item.id)}
                                className={`p-2 rounded-lg transition-colors ${item.alerta_ativo ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-400'}`}
                                title={item.alerta_ativo ? "Desativar Alerta" : "Ativar Alerta"}
                            >
                                {item.alerta_ativo ? <BellRing size={20} /> : <BellOff size={20} />}
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Estoque Mínimo (Trigger de Alerta)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-teal-500 transition-all font-black text-slate-700 outline-none"
                                    value={item.estoque_minimo || 0}
                                    onChange={(e) => handleUpdateMinimo(item.id, e.target.value)}
                                    placeholder="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                                    {item.unidade_medida || (categoria === 'MATERIA_PRIMA' ? 'KG' : 'UN')}
                                </span>
                            </div>
                            {item.alerta_ativo && (item.estoque_atual || item.quantidade_atual || 0) < (item.estoque_minimo || 0) && (
                                <p className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1 mt-1">
                                    <ShieldAlert size={10} /> Item já em alerta crítico!
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredItens.length === 0 && (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                    <Search size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-black text-slate-800">Nenhum item encontrado</h3>
                    <p className="text-slate-500 font-medium">Tente outro termo de busca ou alterne a categoria.</p>
                </div>
            )}
        </div>
    );
};

export default EstoqueConfig;
