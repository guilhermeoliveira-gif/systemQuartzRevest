import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expedicaoService } from '../../services/expedicaoService';
import { useToast } from '../../contexts/ToastContext';
import { Truck, MapPin, Package, Calendar, ArrowRight, X, Printer, Save } from 'lucide-react';
import { Carga } from '../../types_expedicao';

const MontagemCarga: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Estados da Carga
    const [cargaAtiva, setCargaAtiva] = useState<Carga | null>(null); // Se null, criando nova
    const [motorista, setMotorista] = useState('');
    const [veiculo, setVeiculo] = useState('');

    // Listas de Seleção
    const [listaMotoristas, setListaMotoristas] = useState<{ id: string, nome: string }[]>([]);
    const [listaVeiculos, setListaVeiculos] = useState<any[]>([]);

    // Listas
    const [pedidosDisponiveis, setPedidosDisponiveis] = useState<any[]>([]);
    const [pedidosNaCarga, setPedidosNaCarga] = useState<any[]>([]);

    // Filtros
    const [filtroRegiao, setFiltroRegiao] = useState<'TODO' | 'UBERLANDIA' | 'REGIAO'>('TODO');
    const [filtroTexto, setFiltroTexto] = useState('');

    // Totais
    const [resumo, setResumo] = useState({ pesoTotal: 0, paletesTotal: 0, argamassa: 0, rejunte: 0 });

    useEffect(() => {
        carregarPedidosDisponiveis();
    }, [filtroRegiao]);

    useEffect(() => {
        carregarDadosAuxiliares();
    }, []);

    const carregarDadosAuxiliares = async () => {
        try {
            const [mots, veics] = await Promise.all([
                expedicaoService.getMotoristas(),
                expedicaoService.getVeiculos()
            ]);
            setListaMotoristas(mots);
            setListaVeiculos(veics);
        } catch (error) {
            console.error('Erro ao carregar dados auxiliares:', error);
        }
    };

    // Recalcula totais sempre que a lista da carga mudar
    useEffect(() => {
        const todosItens = pedidosNaCarga.flatMap(p => p.itens || []);
        const calculo = expedicaoService.calcularPesoEPaletes(todosItens);
        setResumo(calculo);
    }, [pedidosNaCarga]);

    const carregarPedidosDisponiveis = async () => {
        try {
            const dados = await expedicaoService.getPedidosDisponiveis(filtroRegiao);
            setPedidosDisponiveis(dados);
        } catch (error) {
            console.error(error);
            showToast('error', 'Erro ao carregar pedidos.');
        }
    };

    const moverParaCarga = async (pedido: any) => {
        // Verificar pendências
        try {
            const temPendencias = await expedicaoService.verificarPendenciasCliente(pedido.cliente.id);
            if (temPendencias) {
                const confirmar = window.confirm(`ATENÇÃO: O cliente ${pedido.cliente.nome} possui pendências de entrega em aberto.\n\nDeseja continuar e adicionar o pedido à carga mesmo assim?`);
                if (!confirmar) return;
            }
        } catch (error) {
            console.error('Erro ao verificar pendências:', error);
            // Em caso de erro, permitir adicionar mas avisar
            showToast('error', 'Erro ao verificar pendências do cliente');
        }

        setPedidosNaCarga([...pedidosNaCarga, pedido]);
        setPedidosDisponiveis(pedidosDisponiveis.filter(p => p.id !== pedido.id));
    };

    const removerDaCarga = (pedido: any) => {
        setPedidosDisponiveis([...pedidosDisponiveis, pedido]);
        setPedidosNaCarga(pedidosNaCarga.filter(p => p.id !== pedido.id));
    };

    const salvarCarga = async () => {
        if (!motorista || !veiculo) {
            showToast('warning', 'Informe Motorista e Veículo');
            return;
        }
        if (pedidosNaCarga.length === 0) {
            showToast('warning', 'Adicione pedidos à carga');
            return;
        }

        try {
            // 1. Criar Carga
            const novaCarga = await expedicaoService.criarCarga({
                motorista,
                veiculo,
                peso_total: resumo.pesoTotal,
                paletes_total: resumo.paletesTotal,
                status: 'ABERTA'
            });

            // 2. Vincular Pedidos
            for (const pedido of pedidosNaCarga) {
                await expedicaoService.adicionarPedidoCarga(novaCarga.id, pedido.id);
            }

            showToast('success', `Carga #${novaCarga.numero_carga} criada com sucesso!`);
            navigate('/expedicao'); // Vai para dashboard (a criar)
        } catch (error) {
            console.error(error);
            showToast('error', 'Erro ao salvar carga.');
        }
    };

    // Filter local por texto e exclusão dos que já estão na carga
    const disponiveisFiltrados = pedidosDisponiveis.filter(p => {
        const jaNaCarga = pedidosNaCarga.some(n => n.id === p.id);
        if (jaNaCarga) return false;

        return p.cliente?.nome?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
            p.numero_pedido?.toString().includes(filtroTexto)
    });

    return (
        <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
            {/* Header - Mais compacto */}
            <header className="bg-white border-b px-4 py-2 md:px-6 md:py-3 flex flex-wrap justify-between items-center shadow-sm z-10 gap-2">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg text-white hidden md:block shadow-md">
                        <Truck size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">Montagem de Carga</h1>
                        <p className="text-[10px] md:text-xs text-slate-500 font-medium">Expedição / Romaneio</p>
                    </div>
                </div>

                <div className="flex gap-2 items-center bg-slate-50 p-1.5 rounded-lg border flex-1 md:flex-none max-w-full md:max-w-md">
                    <div className="flex flex-col flex-1 min-w-[120px]">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Motorista</label>
                        <select
                            className="bg-transparent outline-none font-bold text-slate-800 text-xs md:text-sm px-1 cursor-pointer"
                            value={motorista}
                            onChange={e => setMotorista(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {listaMotoristas.map(m => (
                                <option key={m.id} value={m.nome}>{m.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-px h-6 bg-slate-300"></div>
                    <div className="flex flex-col flex-1 min-w-[120px]">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Veículo</label>
                        <select
                            className="bg-transparent outline-none font-bold text-slate-800 text-xs md:text-sm px-1 cursor-pointer"
                            value={veiculo}
                            onChange={e => setVeiculo(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {listaVeiculos.map(v => (
                                <option key={v.id} value={`${v.placa} - ${v.modelo || v.marca}`}>{v.placa} - {v.modelo || v.marca}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => navigate('/expedicao')} className="flex-1 md:flex-none px-3 py-1.5 text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors">Cancelar</button>
                    <button onClick={salvarCarga} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95">
                        <Save size={16} /> Salvar
                    </button>
                </div>
            </header>

            {/* Conteúdo Principal (2 Colunas) */}
            <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

                {/* COLUNA ESQUERDA: Pedidos Disponíveis */}
                <section className="flex-1 flex flex-col border-r bg-white md:min-w-[400px] h-1/2 md:h-auto overflow-hidden">
                    <div className="p-3 border-b bg-slate-50 space-y-2">
                        <div className="flex justify-between items-center gap-2">
                            <h2 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                <Package size={16} className="text-orange-500" />
                                <span>Disponíveis</span>
                                <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[10px]">{disponiveisFiltrados.length}</span>
                            </h2>
                            <div className="flex bg-white rounded-md border p-0.5 shadow-sm">
                                <button
                                    onClick={() => setFiltroRegiao('TODO')}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${filtroRegiao === 'TODO' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                                >Todos</button>
                                <button
                                    onClick={() => setFiltroRegiao('UBERLANDIA')}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${filtroRegiao === 'UBERLANDIA' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                                >UDI</button>
                                <button
                                    onClick={() => setFiltroRegiao('REGIAO')}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${filtroRegiao === 'REGIAO' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                                >REG</button>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Filtrar por nome ou pedido..."
                                className="w-full pl-3 pr-8 py-1.5 border rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={filtroTexto}
                                onChange={e => setFiltroTexto(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-2 space-y-2 bg-slate-50/50 scrollbar-thin">
                        {disponiveisFiltrados.map(pedido => (
                            <div key={pedido.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-all group flex gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 text-sm truncate">{pedido.cliente?.nome}</span>
                                            <span className="text-[10px] font-medium text-slate-400">Pedido #{pedido.numero_pedido}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded-full">
                                                {pedido.cliente?.cidade}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Lista de Itens mais visível */}
                                    <div className="mt-2 bg-slate-50 border border-slate-100 rounded-md p-1.5 space-y-1">
                                        {Array.isArray(pedido.itens) ? pedido.itens.map((i: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-[11px]">
                                                <span className="text-slate-700 font-medium truncate pr-2">
                                                    {(i.produto && i.produto.nome) ? i.produto.nome : 'Produto'}
                                                </span>
                                                <span className="text-blue-700 font-bold bg-white border px-1 rounded">
                                                    {i.quantidade || 0}
                                                </span>
                                            </div>
                                        )) : <span className="text-[10px] text-slate-400 italic">Sem itens</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => moverParaCarga(pedido)}
                                    className="self-center bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-100 flex-shrink-0 transition-transform active:scale-90"
                                >
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>


                {/* COLUNA DIREITA: Carga Atual */}
                <section className="flex-1 flex flex-col bg-slate-100 border-l border-slate-200 h-1/2 md:h-auto overflow-hidden">
                    <div className="p-3 border-b bg-white flex justify-between items-center shadow-sm">
                        <h2 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                            <Truck size={16} className="text-blue-600" />
                            <span>Carga Atual</span>
                            <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[10px]">{pedidosNaCarga.length}</span>
                        </h2>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider italic">Mover para remover</div>
                    </div>

                    <div className="flex-1 overflow-auto p-2 space-y-2 scrollbar-thin">
                        {pedidosNaCarga.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center opacity-50">
                                <Truck size={40} className="mb-3 text-slate-300" />
                                <p className="text-xs font-bold uppercase tracking-tight">Carga Vazia</p>
                                <p className="text-[10px]">Adicione pedidos à esquerda</p>
                            </div>
                        ) : (
                            pedidosNaCarga.map((pedido, idx) => (
                                <div key={pedido.id} className="bg-white p-3 rounded-lg border-l-4 border-blue-600 border-t border-r border-b border-slate-200 shadow-sm flex gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-800 text-sm truncate">{idx + 1}. {pedido.cliente?.nome}</span>
                                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded font-bold">UDI</span>
                                        </div>

                                        {/* Lista de Itens na Carga */}
                                        <div className="mt-2 grid grid-cols-1 gap-1">
                                            {Array.isArray(pedido.itens) && pedido.itens.map((i: any, idxIt: number) => (
                                                <div key={idxIt} className="flex justify-between text-[11px] bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/50">
                                                    <span className="text-slate-600 truncate">{(i.produto && i.produto.nome) ? i.produto.nome : 'Produto'}</span>
                                                    <span className="text-blue-800 font-bold ml-2">x{i.quantidade || 0}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removerDaCarga(pedido)}
                                        className="self-start text-slate-300 hover:text-red-500 p-1 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Resumo da Carga (Footer) - Mais robusto e visível */}
                    <div className="bg-slate-900 text-white border-t p-3 md:p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.15)]">
                        <div className="grid grid-cols-4 gap-2 md:gap-4">
                            <div className="bg-white/10 p-2 rounded-lg text-center border border-white/5">
                                <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Peso</div>
                                <div className="text-sm md:text-lg font-black text-white leading-tight">
                                    {(resumo.pesoTotal || 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">kg</span>
                                </div>
                            </div>
                            <div className="bg-blue-600/20 p-2 rounded-lg text-center border border-blue-500/30">
                                <div className="text-[9px] text-blue-300 font-bold uppercase mb-0.5">Paletes</div>
                                <div className="text-sm md:text-lg font-black text-blue-400 leading-tight">
                                    {resumo.paletesTotal} <span className="text-[10px] font-normal text-blue-300/60">un</span>
                                </div>
                            </div>
                            <div className="bg-white/10 p-2 rounded-lg text-center border border-white/5">
                                <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Argamassa</div>
                                <div className="text-sm md:text-lg font-black text-white leading-tight">
                                    {resumo.argamassa} <span className="text-[10px] font-normal text-slate-400">sc</span>
                                </div>
                            </div>
                            <div className="bg-white/10 p-2 rounded-lg text-center border border-white/5">
                                <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Rejunte</div>
                                <div className="text-sm md:text-lg font-black text-white leading-tight">
                                    {resumo.rejunte} <span className="text-[10px] font-normal text-slate-400">kg</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default MontagemCarga;
