import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { logger } from '../utils/logger';

// Definição da interface para resposta do webhook
interface WebhookResponse {
  output?: string;
  message?: string;
  text?: string;
  response?: string;
  [key: string]: any;
}

const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([
    { role: 'bot', content: 'Olá! Sou o Assistente QuartzRevest. Como posso otimizar o estoque e a produção hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const webhookUrl = "https://n8n.gestaoquartzrevest.com.br/webhook/57aff57d-e43c-41cf-87c4-7053c6924c84";

      logger.debug('Enviando mensagem para IA', {
        url: webhookUrl,
        messageLength: userMsg.length
      });

      const response = await fetch(webhookUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/plain, */*"
        },
        body: JSON.stringify({ chatInput: userMsg })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      let botResponse = "Recebi sua mensagem, mas não consegui processar a resposta.";
      const rawText = await response.text();

      if (!rawText || rawText.trim() === '') {
        logger.warn("Resposta vazia do servidor de IA");
        botResponse = "O servidor respondeu, mas não enviou nenhum conteúdo.";
      } else if (contentType && contentType.indexOf("application/json") !== -1) {
        try {
          const data = JSON.parse(rawText) as WebhookResponse;
          botResponse = data.output || data.message || data.text || data.response || JSON.stringify(data);
          logger.debug("Resposta JSON processada com sucesso", { responseLength: botResponse.length });
        } catch (jsonError) {
          logger.error("Erro ao fazer parse do JSON da IA", jsonError);
          botResponse = rawText; // Fallback
        }
      } else {
        botResponse = rawText;
      }

      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);

    } catch (error: any) {
      logger.error("Erro na requisição para IA", error);

      let errorMessage = "Desculpe, não consegui conectar ao servidor de inteligência no momento.";

      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        errorMessage = "Problema de conexão. Verifique sua internet ou tente novamente em instantes.";
      }

      setMessages(prev => [...prev, { role: 'bot', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[100] bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center group"
      >
        <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] bg-white border border-neutral-200 w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
            <Bot size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">Quartz Assistant</span>
            <span className="text-[10px] text-blue-200 uppercase">Inteligência Industrial</span>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
          <X size={20} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-none'
              }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-neutral-200 p-3 rounded-2xl shadow-sm rounded-tl-none flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-neutral-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Falar com Assistente Quartz..."
          className="flex-1 px-4 py-2.5 bg-neutral-100 border-none rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm transition-all"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-90"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default AIChatAssistant;
