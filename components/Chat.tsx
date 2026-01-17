
import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, UserPreferences } from '../types';
import { chatWithAI } from '../geminiService';
import { Send, User, Bot, ExternalLink, Loader2 } from 'lucide-react';

interface ChatProps {
  inventory: InventoryItem[];
  preferences: UserPreferences;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  links?: { title: string; uri: string }[];
}

const Chat: React.FC<ChatProps> = ({ inventory, preferences }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hi! I'm your FRIDGERAIDER assistant. Ask me anything about your inventory, recipes, or search for food trends!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const response = await chatWithAI(userMsg, inventory);
    
    setMessages(prev => [...prev, { 
      role: 'ai', 
      content: response.text || "I couldn't get a response. Please try again.",
      links: response.links
    }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-cyan-500 text-slate-900' : 'bg-white/10 text-white'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-500/10 border border-cyan-500/20' : 'glass'}`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.links && msg.links.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Sources</p>
                    {msg.links.map((link, lidx) => (
                      <a 
                        key={lidx} 
                        href={link.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                      >
                        <ExternalLink size={10} /> {link.title || 'Link'}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass p-4 rounded-2xl flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-cyan-400" />
              <span className="text-sm text-slate-400">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="relative">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me for a recipe or type 'search for...'"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-cyan-500 transition-all shadow-xl"
        />
        <button 
          disabled={loading || !input.trim()}
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-slate-950 rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-30"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
