import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

const ChecklistSummary: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pendentes: 0,
        hoje: 0,
        atrasados: 0
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const hoje = new Date().toISOString().split('T')[0];

            // Pendentes
            const { count: pendentes } = await supabase
                .from('checklist_agendamento')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENDENTE');

            // Agendados para Hoje
            const { count: agendadosHoje } = await supabase
                .from('checklist_agendamento')
                .select('*', { count: 'exact', head: true })
                .gte('data_agendamento', `${hoje}T00:00:00`)
                .lte('data_agendamento', `${hoje}T23:59:59`);

            // Atrasados (Pendentes anteriores a hoje)
            const { count: atrasados } = await supabase
                .from('checklist_agendamento')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENDENTE')
                .lt('data_agendamento', `${hoje}T00:00:00`);

            setStats({
                pendentes: pendentes || 0,
                hoje: agendadosHoje || 0,
                atrasados: atrasados || 0
            });
        } catch (error) {
            console.error('Erro ao carregar stats de checklist', error);
        }
    };

    return (
        <div
            onClick={() => navigate('/checklist/agendamento')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Checklists</h3>
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                    <ClipboardCheck size={20} />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Pendentes</span>
                    <span className="text-lg font-black text-slate-800">{stats.pendentes}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Agendados Hoje</span>
                    <span className="text-lg font-black text-purple-600">
                        {stats.hoje}
                    </span>
                </div>
                {stats.atrasados > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-red-600">
                        <span className="text-xs font-bold uppercase flex items-center gap-1">
                            <AlertCircle size={12} /> Atrasados
                        </span>
                        <span className="text-sm font-bold">
                            {stats.atrasados}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChecklistSummary;
