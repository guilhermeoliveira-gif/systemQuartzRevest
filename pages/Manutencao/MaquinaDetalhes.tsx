
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Settings, Activity, Clock,
    Calendar, AlertTriangle, CheckCircle2,
    Plus, Trash2, BookOpen, Lightbulb, Link as LinkIcon
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge, Skeleton } from '../../components/ui/Utility';
import { Dialog } from '../../components/ui/Dialog';
import { manutencaoService } from '../../services/manutencaoService';
import { Maquina, MaquinaItem, Aprendizado } from '../../types_manutencao';
import { useToast } from '../../contexts/ToastContext';

const MaquinaDetalhes: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [maquina, setMaquina] = useState<Maquina | null>(null);
    const [itens, setItens] = useState<MaquinaItem[]>([]);
    const [aprendizados, setAprendizados] = useState<Aprendizado[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isItemOpen, setIsItemOpen] = useState(false);
    const [isAprenderOpen, setIsAprenderOpen] = useState(false);

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const machines = await manutencaoService.getMaquinas();
            const found = machines.find(m => m.id === id);
            if (found) {
                setMaquina(found);
                const [itemsList, learningList] = await Promise.all([
                    manutencaoService.getItensMaquina(id),
                    manutencaoService.getAprendizados(id)
                ]);
                setItens(itemsList);
                setAprendizados(learningList);
            }
        } catch (error) {
            toast.error('Erro', 'Falha ao carregar detalhes.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-black animate-pulse text-blue-800">CARREGANDO ATIVO...</div>;
    if (!maquina) return <div className="p-20 text-center">Máquina não encontrada.</div>;

    const horasDesdeUltima = maquina.horas_uso_total - maquina.ultima_manutencao_horas;
    const progressPrev = Math.min((horasDesdeUltima / maquina.intervalo_manutencao_horas) * 100, 100);

    return (
        <div className="space-y-8 pb-32">
            <header className="flex items-center gap-4">
                <button onClick={() => navigate('/manutencao/maquinas')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">{maquina.nome}</h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{maquina.modelo} • {maquina.serie}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Stats Cards */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Horas Totais</p>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-blue-800">{maquina.horas_uso_total}</span>
                        <span className="text-slate-400 font-bold text-xs mb-1">HORAS</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Última Manutenção</p>
                    <div className="flex items-end gap-2">
                        <span className="text-xl font-black text-slate-700">{maquina.ultima_manutencao_data ? new Date(maquina.ultima_manutencao_data).toLocaleDateString('pt-BR') : 'NEHUMA'}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Em {maquina.ultima_manutencao_horas}h</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total de Intervenções</p>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-green-600">{maquina.quantidade_manutencoes}</span>
                        <span className="text-slate-400 font-bold text-xs mb-1">EVENTOS</span>
                    </div>
                </div>
                <div className="bg-blue-800 p-6 rounded-3xl shadow-lg border border-blue-900 text-white">
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-2">Ciclo de Preventiva</p>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-lg font-black">{Math.round(progressPrev)}%</span>
                        <span className="text-[10px] font-black opacity-60">{horasDesdeUltima}/{maquina.intervalo_manutencao_horas}h</span>
                    </div>
                    <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                        <div className="bg-white h-full transition-all duration-1000" style={{ width: `${progressPrev}%` }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Components / Machine Items */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <Settings size={20} className="text-blue-800" /> Componentes & Itens
                        </h2>
                        <Button variant="ghost" className="h-8 px-4 text-xs font-black uppercase tracking-widest text-blue-800" onClick={() => setIsItemOpen(true)}>
                            <Plus size={14} className="mr-1" /> Add Item
                        </Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-transparent hover:bg-transparent">
                                <TableHead className="text-[10px] uppercase font-black text-slate-400">Componente</TableHead>
                                <TableHead className="text-[10px] uppercase font-black text-slate-400">Periodicidade</TableHead>
                                <TableHead className="text-[10px] uppercase font-black text-slate-400">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {itens.map(item => (
                                <TableRow key={item.id} className="hover:bg-slate-50 border-slate-50">
                                    <TableCell className="font-bold text-slate-700">{item.nome}</TableCell>
                                    <TableCell className="text-xs font-medium text-slate-500">
                                        {item.periodicidade_horas ? `${item.periodicidade_horas}h` : `${item.periodicidade_dias} dias`}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={
                                            item.status === 'OK' ? 'bg-green-100 text-green-700' :
                                                item.status === 'Crítico' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                        }>{item.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {itens.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-10 text-slate-400 italic text-sm">Nenhum componente registrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Knowledge Base / Learning */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-fit">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <Lightbulb size={20} className="text-amber-500" /> Aprendizados & Manutenção
                        </h2>
                        <Button variant="ghost" className="h-8 px-4 text-xs font-black uppercase tracking-widest text-blue-800" onClick={() => setIsAprenderOpen(true)}>
                            Novo Registro
                        </Button>
                    </div>
                    <div className="p-6 space-y-6 max-h-[400px] overflow-y-auto">
                        {aprendizados.map(ap => (
                            <div key={ap.id} className="relative pl-6 border-l-2 border-slate-100 py-1">
                                <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-white border-2 border-slate-200" />
                                <h4 className="font-black text-slate-800 text-sm leading-tight mb-1">{ap.titulo}</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{ap.descricao}</p>
                                <div className="flex gap-2 mt-2">
                                    {ap.tags?.map(t => (
                                        <span key={t} className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">{t}</span>
                                    ))}
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 uppercase mt-2 block">{new Date(ap.created_at!).toLocaleDateString('pt-BR')}</span>
                            </div>
                        ))}
                        {aprendizados.length === 0 && (
                            <div className="text-center py-10 opacity-40 grayscale flex flex-col items-center gap-2">
                                <BookOpen size={40} />
                                <p className="text-sm font-bold">Nenhum aprendizado técnico registrado ainda.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Links / Relation Section */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-300">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <LinkIcon size={18} /> Projetos e Tarefas Vinculadas
                </h2>
                <div className="flex flex-wrap gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-800"><Settings size={20} /></div>
                        <div>
                            <p className="text-xs font-black text-slate-800">Manutenção Ensacadeira #3</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Projeto Ativo</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs Mocks (Logic omitted for brevity in this step) */}
            {isItemOpen && (
                <Dialog isOpen={isItemOpen} onClose={() => setIsItemOpen(false)} title="Add Componente">
                    <div className="p-4 text-center">Formulário para adicionar itens aqui...</div>
                </Dialog>
            )}
            {isAprenderOpen && (
                <Dialog isOpen={isAprenderOpen} onClose={() => setIsAprenderOpen(false)} title="Registrar Aprendizado">
                    <div className="p-4 text-center">Formulário para base de conhecimento aqui...</div>
                </Dialog>
            )}
        </div>
    );
};

export default MaquinaDetalhes;
