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

    // Filter local por texto
    const disponiveisFiltrados = pedidosDisponiveis.filter(p =>
        p.cliente?.nome?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        p.numero_pedido?.toString().includes(filtroTexto)
    );

    return (
        <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Montagem de Carga</h1>
                        <p className="text-sm text-slate-500">Expedição / Romaneio</p>
                    </div>
                </div>

                <div className="flex gap-4 items-center bg-slate-50 p-2 rounded-lg border">
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-slate-500 uppercase">Motorista</label>
                        <input
                            className="bg-transparent outline-none font-medium text-slate-800 placeholder-slate-400"
                            placeholder="Nome Completo"
                            value={motorista}
                            onChange={e => setMotorista(e.target.value)}
                        />
                    </div>
                    <div className="w-px h-8 bg-slate-300"></div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-slate-500 uppercase">Veículo</label>
                        <input
                            className="bg-transparent outline-none font-medium text-slate-800 placeholder-slate-400"
                            placeholder="Placa / Modelo"
                            value={veiculo}
                            onChange={e => setVeiculo(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => navigate('/expedicao')} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Cancelar</button>
                    <button onClick={salvarCarga} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95">
                        <Save size={18} /> Salvar Carga
                    </button>
                </div>
            </header>

            {/* Conteúdo Principal (2 Colunas) */}
            <main className="flex-1 flex overflow-hidden">

                {/* COLUNA ESQUERDA: Pedidos Disponíveis */}
                <section className="flex-1 flex flex-col border-r bg-white min-w-[400px]">
                    <div className="p-4 border-b bg-slate-50 space-y-3">
                        <div className="flex justify-between items-center">
                            <h2 className="font-bold text-slate-700 flex items-center gap-2">
                                <Package size={18} className="text-orange-500" /> Pedidos Disponíveis ({disponiveisFiltrados.length})
                            </h2>
                            <div className="flex bg-white rounded-lg border p-1 shadow-sm">
                                <button
                                    onClick={() => setFiltroRegiao('TODO')}
                                    className={`px-3 py-1 text-xs font-bold rounded ${filtroRegiao === 'TODO' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                                >Todos</button>
                                <button
                                    onClick={() => setFiltroRegiao('UBERLANDIA')}
                                    className={`px-3 py-1 text-xs font-bold rounded ${filtroRegiao === 'UBERLANDIA' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                                >Uberlândia</button>
                                <button
                                    onClick={() => setFiltroRegiao('REGIAO')}
                                    className={`px-3 py-1 text-xs font-bold rounded ${filtroRegiao === 'REGIAO' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                                >Região</button>
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Filtrar por cliente..."
                            className="w-full p-2 border rounded-lg text-sm bg-white"
                            value={filtroTexto}
                            onChange={e => setFiltroTexto(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-auto p-4 space-y-3 bg-slate-50/50">
                        {disponiveisFiltrados.map(pedido => (
                            <div key={pedido.id} className="bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow group flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-800 text-lg">{pedido.cliente?.nome}</span>
                                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">#{pedido.numero_pedido}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={12} /> {pedido.cliente?.cidade} - {pedido.cliente?.bairro}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} /> {new Date(pedido.data_previsao_entrega).toLocaleDateString()}
                                        </div>
                                    </div>
                                    {/* Resumo de itens visual */}
                                    <div className="mt-2 text-xs text-slate-600 line-clamp-1">
                                        {Array.isArray(pedido.itens) ? pedido.itens.map((i: any) =>
                                            `${i.quantidade || 0}x ${(i.produto && i.produto.nome) ? i.produto.nome : 'Produto'}`
                                        ).join(', ') : 'Sem itens'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => moverParaCarga(pedido)}
                                    className="bg-blue-50 text-blue-600 p-2 rounded-full hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>


                {/* COLUNA DIREITA: Carga Atual */}
                <section className="flex-1 flex flex-col bg-slate-100 border-l-4 border-slate-200">
                    <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm">
                        <h2 className="font-bold text-slate-700 flex items-center gap-2">
                            <Truck size={18} className="text-blue-600" /> Carga Atual ({pedidosNaCarga.length} Pedidos)
                        </h2>
                        <div className="text-xs text-slate-400">Arraste ou clique para adicionar/remover</div>
                    </div>

                    <div className="flex-1 overflow-auto p-4 space-y-3">
                        {pedidosNaCarga.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Truck size={48} className="mb-4 text-slate-300" />
                                <p>Nenhum pedido na carga</p>
                                <p className="text-sm">Selecione pedidos à esquerda</p>
                            </div>
                        ) : (
                            pedidosNaCarga.map((pedido, idx) => (
                                <div key={pedido.id} className="bg-white p-3 rounded-lg border-l-4 border-blue-500 shadow-sm flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-slate-800">{idx + 1}. {pedido.cliente?.nome}</div>
                                        <div className="text-xs text-slate-500">{pedido.cliente?.cidade}</div>
                                    </div>
                                    <button
                                        onClick={() => removerDaCarga(pedido)}
                                        className="text-red-400 hover:text-red-600 p-2"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Resumo da Carga (Footer) */}
                    <div className="bg-white border-t p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                        <div className="grid grid-cols-4 gap-4 mb-2">
                            <div className="bg-slate-50 p-3 rounded-lg border text-center">
                                <div className="text-xs text-slate-500 font-bold uppercase">Peso Total</div>
                                <div className="text-xl font-bold text-slate-800">{(resumo.pesoTotal || 0).toLocaleString()} <span className="text-xs text-slate-400">kg</span></div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                                <div className="text-xs text-blue-500 font-bold uppercase">Paletes</div>
                                <div className="text-xl font-bold text-blue-700">{resumo.paletesTotal} <span className="text-xs text-blue-400">un</span></div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border text-center">
                                <div className="text-xs text-slate-500 font-bold uppercase">Argamassa</div>
                                <div className="text-lg font-bold text-slate-700">{resumo.argamassa} <span className="text-xs text-slate-400">sc</span></div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border text-center">
                                <div className="text-xs text-slate-500 font-bold uppercase">Rejunte</div>
                                <div className="text-lg font-bold text-slate-700">{resumo.rejunte} <span className="text-xs text-slate-400">kg</span></div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default MontagemCarga;
