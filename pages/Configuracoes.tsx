
import React from 'react';
import { User, Shield, Building2, Bell, Globe } from 'lucide-react';

const Configuracoes: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900">Configurações</h1>
        <p className="text-neutral-500">Gerencie sua conta e preferências do sistema QuartzRevest.</p>
      </header>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="bg-white border border-neutral-700 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-700 bg-gray-50 flex items-center gap-3">
            <User size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold">Perfil do Usuário</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nome Completo</label>
                <input type="text" defaultValue="Carlos Gerente" className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Email Corporativo</label>
                <input type="email" defaultValue="carlos@quartzrevest.com.br" className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" disabled />
              </div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">Atualizar Perfil</button>
          </div>
        </section>

        {/* Organization Section */}
        <section className="bg-white border border-neutral-700 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-700 bg-gray-50 flex items-center gap-3">
            <Building2 size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold">Organização</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nome da Empresa</label>
              <input type="text" defaultValue="QuartzRevest Revestimentos Especiais 4.0" className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
            </div>

          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-white border border-neutral-700 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-700 bg-gray-50 flex items-center gap-3">
            <Bell size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold">Notificações</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Alertas de Estoque Baixo</p>
                <p className="text-xs text-neutral-500">Notificar quando MP atingir o limite crítico.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-blue-600" />
            </div>
            <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
              <div>
                <p className="font-bold text-sm">Relatórios Semanais</p>
                <p className="text-xs text-neutral-500">Receber resumo de produção por email.</p>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-blue-600" />
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-white border border-neutral-700 rounded-xl shadow-sm overflow-hidden border-red-200">
          <div className="p-6 border-b border-red-100 bg-red-50 flex items-center gap-3">
            <Shield size={20} className="text-red-600" />
            <h2 className="text-lg font-bold text-red-900">Segurança</h2>
          </div>
          <div className="p-6 space-y-4">
            <button className="text-red-600 border border-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors">Alterar Senha de Acesso</button>
            <button className="text-neutral-500 text-xs hover:underline block">Excluir minha conta e dados da organização</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Configuracoes;
