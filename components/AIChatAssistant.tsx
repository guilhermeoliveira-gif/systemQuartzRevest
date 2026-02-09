import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MessageSquare, Send, X, Bot, Loader2 } from 'lucide-react';

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
      console.log("=== INÍCIO DA REQUISIÇÃO ===");
      console.log("1. Mensagem do usuário:", userMsg);
      console.log("2. URL do webhook:", "https://n8n.gestaoquartzrevest.com.br/webhook/57aff57d-e43c-41cf-87c4-7053c6924c84");
      console.log("3. Payload enviado:", { chatInput: userMsg });

      const response = await fetch("https://n8n.gestaoquartzrevest.com.br/webhook/57aff57d-e43c-41cf-87c4-7053c6924c84", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/plain, */*"
        },
        body: JSON.stringify({ chatInput: userMsg })
      });

      console.log("4. Status da resposta:", response.status, response.statusText);
      console.log("5. Headers da resposta:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      console.log("6. Content-Type:", contentType);
      let botResponse = "Recebi sua mensagem, mas não consegui processar a resposta.";

      const rawText = await response.text();
      console.log("7. Resposta bruta (length:", rawText.length, "):", rawText);
      console.log("8. Primeiros 500 chars:", rawText.substring(0, 500));

      if (!rawText || rawText.trim() === '') {
        console.log("9. ERRO: Resposta vazia!");
        botResponse = "O servidor respondeu, mas não enviou nenhum conteúdo.";
      } else if (contentType && contentType.indexOf("application/json") !== -1) {
        console.log("9. Tentando fazer parse como JSON...");
        try {
          const data = JSON.parse(rawText);
          console.log("10. JSON parseado com sucesso:", data);
          console.log("11. Campos disponíveis no JSON:", Object.keys(data));
          console.log("12. Valores: output=", data.output, "message=", data.message, "text=", data.text, "response=", data.response);

          botResponse = data.output || data.message || data.text || data.response || JSON.stringify(data);
          console.log("13. Resposta final extraída:", botResponse);
        } catch (jsonError) {
          console.error("10. ERRO ao fazer parse do JSON:", jsonError);
          console.log("11. Usando texto bruto como fallback");
          botResponse = rawText;
        }
      } else {
        console.log("9. Resposta não é JSON, usando texto bruto");
        botResponse = rawText || "Resposta vazia do servidor.";
      }

      console.log("=== FIM DA REQUISIÇÃO (SUCESSO) ===");
      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);

    } catch (error) {
      console.error("=== ERRO NA REQUISIÇÃO ===");
      console.error("Tipo do erro:", error instanceof TypeError ? "TypeError" : error instanceof Error ? "Error" : typeof error);
      console.error("Mensagem do erro:", error instanceof Error ? error.message : String(error));
      console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");

      let errorMessage = "Desculpe, não consegui conectar ao servidor de inteligência no momento.";

      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        errorMessage = "❌ Erro de CORS ou conexão bloqueada.\n\nVerifique:\n1. Se o webhook n8n está ativo\n2. Se o CORS está configurado no n8n\n3. Se a URL está correta";
      } else if (error instanceof Error) {
        errorMessage = `❌ Erro: ${error.message}`;
      }

      console.log("Mensagem de erro para o usuário:", errorMessage);
      console.log("=== FIM DA REQUISIÇÃO (ERRO) ===");

      setMessages(prev => [...prev, { role: 'bot', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center group"
        >
          <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
        </button>
      ) : (
        <div className="bg-white border border-neutral-200 w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
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
      )}
    </div>
  );
};

export default AIChatAssistant;
