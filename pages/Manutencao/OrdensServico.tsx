
import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, Pencil, Trash2,
    ChevronLeft, FileText, Calendar, Clock,
    ArrowRight, User, CheckCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge, Skeleton } from '../../components/ui/Utility';
import { Dialog } from '../../components/ui/Dialog';
import { manutencaoService } from '../../services/manutencaoService';
import { OrdemServico, Maquina, StatusOS, TipoManutencao, PrioridadeOS } from '../../types_manutencao';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import MobileCard from '../../components/MobileCard';
import FAB from '../../components/FAB';
import { Settings, Wrench, AlertCircle as AlertIcon } from 'lucide-react';

const OrdensServico: React.FC = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const [oss, setOSS] = useState<OrdemServico[]>([]);
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);

    // Form
    const [formData, setFormData] = useState<Partial<OrdemServico>>({
        maquina_id: '',
        tipo: 'Corretiva',
        prioridade: 'Média',
        descricao: '',
        status: 'Aberta'
    });

    // Finalize Modal
    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const [finalizeData, setFinalizeData] = useState({
        tipo_correcao: 'Definitiva' as 'Definitiva' | 'Paleativa',
        descricao_fechamento: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [osList, machines] = await Promise.all([
                manutencaoService.getOrdensServico(),
                manutencaoService.getMaquinas()
            ]);
            setOSS(osList);
            setMaquinas(machines);
        } catch (error) {
            toast.error('Erro', 'Falha ao carregar ordens de serviço.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.maquina_id || !formData.descricao) {
            return toast.error('Ops', 'Selecionar máquina e descrição são obrigatórios.');
        }
        try {
            await manutencaoService.createOS(formData);
            toast.success('Sucesso', '✅ Ordem de Serviço aberta com sucesso!');
            setIsAddOpen(false);
            setFormData({
                maquina_id: '',
                tipo: 'Corretiva',
                prioridade: 'Média',
                descricao: '',
                status: 'Aberta'
            });
            loadData();
        } catch (error) {
            toast.error('Erro', 'Falha ao abrir OS.');
        }
    };

    const handleReceberOS = async (e: React.MouseEvent, os: OrdemServico) => {
        e.stopPropagation();
        if (window.confirm(`Deseja iniciar a execução da OS para ${os.maquina?.nome}?`)) {
            try {
                await manutencaoService.iniciarOS(os.id);
                toast.success('Iniciado', 'OS em execução.');
                loadData();
            } catch (error) {
                toast.error('Erro', 'Falha ao iniciar OS.');
            }
        }
    };

    const handleOpenFinalize = (e: React.MouseEvent, os: OrdemServico) => {
        e.stopPropagation();
        setSelectedOS(os);
        setFinalizeData({ tipo_correcao: 'Definitiva', descricao_fechamento: '' });
        setIsFinalizeOpen(true);
    };

    const handleFinalizarOS = async () => {
        if (!selectedOS || !finalizeData.descricao_fechamento) {
            return toast.error('Atenção', 'Informe a descrição da solução.');
        }

        try {
            await manutencaoService.finalizarOS(selectedOS.id, finalizeData);
            toast.success('Concluído', 'OS finalizada com sucesso!');
            setIsFinalizeOpen(false);
            loadData();
        } catch (error) {
            toast.error('Erro', 'Falha ao finalizar OS.');
        }
    };

    const getStatusBadge = (status: StatusOS) => {
        switch (status) {
            case 'Aberta': return <Badge className="bg-slate-100 text-slate-700">Aberta</Badge>;
            case 'Em Execução': return <Badge className="bg-blue-100 text-blue-700">Execução</Badge>;
            case 'Concluída': return <Badge className="bg-green-100 text-green-700">Concluída</Badge>;
            case 'Cancelada': return <Badge className="bg-red-100 text-red-700">Cancelada</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const getPriorityBadge = (prio: PrioridadeOS) => {
        switch (prio) {
            case 'Baixa': return <Badge className="bg-slate-50 text-slate-400">Baixa</Badge>;
            case 'Média': return <Badge className="bg-blue-50 text-blue-500">Média</Badge>;
            case 'Alta': return <Badge className="bg-amber-100 text-amber-600">Alta</Badge>;
            case 'Urgente': return <Badge className="bg-red-100 text-red-600">Urgente</Badge>;
            default: return <Badge>{prio}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/manutencao')}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text duration-300 text-slate-500"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Histórico de OS</h1>
                        <p className="text-slate-500 text-sm font-medium uppercase font-mono tracking-widest leading-none mt-1">Maintenance Service Orders</p>
                    </div>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="hidden md:flex bg-blue-800 text-white">
                    <Plus size={18} className="mr-2" /> Abrir Chamado (OS)
                </Button>
            </header>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por descrição ou máquina..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100 font-medium text-slate-700 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="text-slate-600 font-bold uppercase text-[10px] tracking-widest px-6">
                    <Filter size={14} className="mr-2" /> Filtros Avançados
                </Button>
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-slate-200 h-32 rounded-xl" />
                        ))}
                    </div>
                ) : (
                    oss.filter(o =>
                        o.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        o.maquina?.nome.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((os) => (
                        <MobileCard
                            key={os.id}
                            title={os.maquina?.nome || 'Ativo Desconhecido'}
                            subtitle={`${os.tipo} • ${new Date(os.data_abertura).toLocaleDateString('pt-BR')}`}
                            icon={os.tipo === 'Preventiva' ? Settings : Wrench}
                            badge={{
                                text: os.status,
                                color: os.status === 'Concluída' ? 'success' : os.status === 'Em Execução' ? 'warning' : os.status === 'Cancelada' ? 'danger' : 'info'
                            }}
                            onClick={() => { }}
                        >
                            <div className="space-y-3">
                                <p className="text-sm text-slate-600 font-medium">{os.descricao}</p>
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        {getPriorityBadge(os.prioridade)}
                                    </div>
                                    <div className="flex gap-2">
                                        {os.status === 'Aberta' && (
                                            <Button
                                                size="xs"
                                                variant="secondary"
                                                className="bg-blue-50 text-blue-600 py-2 px-3 font-bold"
                                                onClick={(e) => handleReceberOS(e, os)}
                                            >
                                                Receber
                                            </Button>
                                        )}
                                        {(os.status === 'Em Execução' || os.status === 'Aberta') && (
                                            <Button
                                                size="xs"
                                                className="bg-green-600 text-white py-2 px-3 font-bold shadow-md shadow-green-100"
                                                onClick={(e) => handleOpenFinalize(e, os)}
                                            >
                                                Finalizar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </MobileCard>
                    ))
                )}
            </div>

            <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ativo / Tipo</TableHead>
                            <TableHead>Prioridade</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Abertura</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            oss.filter(o =>
                                o.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                o.maquina?.nome.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((os) => (
                                <TableRow key={os.id} className="cursor-pointer group">
                                    <TableCell onClick={() => { }}>
                                        <div className="font-black text-slate-800 uppercase tracking-tighter">{os.maquina?.nome}</div>
                                        <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{os.tipo}</div>
                                    </TableCell>
                                    <TableCell>{getPriorityBadge(os.prioridade)}</TableCell>
                                    <TableCell className="max-w-xs truncate text-slate-500 font-medium">{os.descricao}</TableCell>
                                    <TableCell className="text-slate-400 font-bold text-xs">
                                        {new Date(os.data_abertura).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(os.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {os.status === 'Aberta' && (
                                                <Button
                                                    size="xs"
                                                    variant="secondary"
                                                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold"
                                                    onClick={(e) => handleReceberOS(e, os)}
                                                >
                                                    Receber OS
                                                </Button>
                                            )}
                                            {(os.status === 'Em Execução' || os.status === 'Aberta') && (
                                                <Button
                                                    size="xs"
                                                    className="bg-green-600 text-white hover:bg-green-700 font-bold shadow-green-200"
                                                    onClick={(e) => handleOpenFinalize(e, os)}
                                                >
                                                    <CheckCircle size={14} className="mr-1" /> Finalizar
                                                </Button>
                                            )}
                                            {os.status === 'Concluída' && (
                                                <span className="text-xs font-bold text-green-600 flex items-center">
                                                    <CheckCircle size={14} className="mr-1" /> OK
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {!loading && oss.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
                            <FileText size={40} />
                        </div>
                        <p className="text-slate-400 font-medium">Nenhuma ordem de serviço registrada.</p>
                    </div>
                )}
            </div>

            {/* FAB for Mobile */}
            <div className="md:hidden">
                <FAB
                    onClick={() => setIsAddOpen(true)}
                    label="Nova OS"
                    icon={<Plus size={24} />}
                />
            </div>

            {/* Modal Nova OS */}
            <Dialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Abertura de OS Industrial"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selecione o Ativo</label>
                        <select
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold appearance-none"
                            value={formData.maquina_id}
                            onChange={(e) => setFormData({ ...formData, maquina_id: e.target.value })}
                        >
                            <option value="">Selecione uma máquina...</option>
                            {maquinas.map(m => (
                                <option key={m.id} value={m.id}>{m.nome} ({m.modelo})</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Intervenção</label>
                            <select
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoManutencao })}
                            >
                                <option value="Corretiva">Corretiva</option>
                                <option value="Preventiva">Preventiva</option>
                                <option value="Preditiva">Preditiva</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prioridade</label>
                            <select
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                                value={formData.prioridade}
                                onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as PrioridadeOS })}
                            >
                                <option value="Baixa">Baixa</option>
                                <option value="Média">Média</option>
                                <option value="Alta">Alta</option>
                                <option value="Urgente">Urgente</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição do Problema / Solicitação</label>
                        <textarea
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold h-32"
                            placeholder="Descreva o que está acontecendo..."
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-blue-800 text-white">Criar OS</Button>
                    </div>
                </div>
            </Dialog>

            {/* Modal Finalizar OS */}
            <Dialog
                isOpen={isFinalizeOpen}
                onClose={() => setIsFinalizeOpen(false)}
                title={`Finalizar OS - ${selectedOS?.maquina?.nome || 'Ativo'}`}
            >
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg mb-4">
                        <p className="text-xs font-bold text-blue-800 uppercase mb-1">Problema Relatado</p>
                        <p className="text-sm text-blue-600">{selectedOS?.descricao}</p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Correção</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setFinalizeData({ ...finalizeData, tipo_correcao: 'Definitiva' })}
                                className={`p-3 rounded-xl border font-bold text-sm transition-all ${finalizeData.tipo_correcao === 'Definitiva'
                                    ? 'bg-green-100 border-green-300 text-green-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                Solução Definitiva
                            </button>
                            <button
                                onClick={() => setFinalizeData({ ...finalizeData, tipo_correcao: 'Paleativa' })}
                                className={`p-3 rounded-xl border font-bold text-sm transition-all ${finalizeData.tipo_correcao === 'Paleativa'
                                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                Solução Paleativa
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição da Solução / Fechamento</label>
                        <textarea
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold h-32"
                            placeholder="Descreva o que foi feito para corrigir o problema..."
                            value={finalizeData.descricao_fechamento}
                            onChange={(e) => setFinalizeData({ ...finalizeData, descricao_fechamento: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsFinalizeOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handleFinalizarOS}
                            className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200"
                        >
                            <CheckCircle size={18} className="mr-2" /> Confirmar Finalização
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default OrdensServico;
