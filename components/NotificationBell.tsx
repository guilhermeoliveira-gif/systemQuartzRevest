import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificacoesService } from '../services/notificacoesService';
import { Notificacao } from '../types_notificacoes';

const NotificationBell: React.FC = () => {
    const navigate = useNavigate();
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [naoLidas, setNaoLidas] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadNotificacoes();
        loadContador();

        // Realtime subscription
        const subscription = notificacoesService.subscribeToNotificacoes((novaNotificacao) => {
            setNotificacoes(prev => [novaNotificacao, ...prev]);
            setNaoLidas(prev => prev + 1);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const loadNotificacoes = async () => {
        try {
            const data = await notificacoesService.getNotificacoes(20);
            setNotificacoes(data);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    };

    const loadContador = async () => {
        try {
            const count = await notificacoesService.contarNaoLidas();
            setNaoLidas(count);
        } catch (error) {
            console.error('Erro ao carregar contador:', error);
        }
    };

    const handleMarcarLida = async (id: string, link?: string) => {
        try {
            await notificacoesService.marcarComoLida(id);
            setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
            setNaoLidas(prev => Math.max(0, prev - 1));

            if (link) {
                setIsOpen(false);
                navigate(link);
            }
        } catch (error) {
            console.error('Erro ao marcar como lida:', error);
        }
    };

    const handleMarcarTodasLidas = async () => {
        try {
            setLoading(true);
            await notificacoesService.marcarTodasComoLidas();
            setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
            setNaoLidas(0);
        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIconeNotificacao = (tipo: string) => {
        const icons: Record<string, string> = {
            'TAREFA_ATRIBUIDA': '📋',
            'TAREFA_ATRASADA': '⚠️',
            'PRAZO_PROXIMO': '⏰',
            'NC_CRIADA': '🔴',
            'PROJETO_ATUALIZADO': '📊',
            'ESTOQUE_MINIMO': '📦',
            'SISTEMA': 'ℹ️'
        };
        return icons[tipo] || '🔔';
    };

    const getCorPrioridade = (prioridade: string) => {
        const cores: Record<string, string> = {
            'URGENTE': 'border-l-4 border-red-500 bg-red-50',
            'ALTA': 'border-l-4 border-orange-500 bg-orange-50',
            'NORMAL': 'border-l-4 border-blue-500',
            'BAIXA': 'border-l-4 border-slate-300'
        };
        return cores[prioridade] || '';
    };

    const formatarTempo = (data: string) => {
        const agora = new Date();
        const notif = new Date(data);
        const diff = Math.floor((agora.getTime() - notif.getTime()) / 1000);

        if (diff < 60) return 'Agora';
        if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
        return `${Math.floor(diff / 86400)}d atrás`;
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
                <Bell size={22} />
                {naoLidas > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {naoLidas > 9 ? '9+' : naoLidas}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Notificações</h3>
                        <div className="flex gap-2">
                            {naoLidas > 0 && (
                                <button
                                    onClick={handleMarcarTodasLidas}
                                    disabled={loading}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                    <CheckCheck size={14} />
                                    Marcar todas
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Lista de Notificações */}
                    <div className="overflow-y-auto flex-1">
                        {notificacoes.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Bell size={48} className="mx-auto mb-2 opacity-50" />
                                <p>Nenhuma notificação</p>
                            </div>
                        ) : (
                            notificacoes.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleMarcarLida(notif.id, notif.link)}
                                    className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition ${!notif.lida ? 'bg-blue-50' : ''
                                        } ${getCorPrioridade(notif.prioridade)}`}
                                >
                                    <div className="flex gap-3">
                                        <div className="text-2xl">{getIconeNotificacao(notif.tipo)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-semibold text-sm text-slate-800 truncate">
                                                    {notif.titulo}
                                                </h4>
                                                {!notif.lida && (
                                                    <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2 mb-1">
                                                {notif.mensagem}
                                            </p>
                                            <span className="text-xs text-slate-400">
                                                {formatarTempo(notif.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
