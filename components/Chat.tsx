
import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, UserPreferences } from '../types';
import { chatWithAIStream } from '../geminiService';
import { Send, User, Bot, ExternalLink, Loader2, Sparkles, Globe } from 'lucide-react';

interface ChatProps {
  inventory: InventoryItem[];
  preferences: UserPreferences;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  links?: { title: string; uri: string }[];
  isStreaming?: boolean;
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

    // Add an empty AI message for streaming
    setMessages(prev => [...prev, { role: 'ai', content: '', isStreaming: true }]);

    try {
      await chatWithAIStream(
        userMsg, 
        inventory, 
        (chunkText) => {
          setMessages(prev => {
            const next = [...prev];
            const lastMsg = next[next.length - 1];
            if (lastMsg && lastMsg.role === 'ai') {
              next[next.length - 1] = { ...lastMsg, content: chunkText };
            }
            return next;
          });
        },
        (links) => {
          setMessages(prev => {
            const next = [...prev];
            const lastMsg = next[next.length - 1];
            if (lastMsg && lastMsg.role === 'ai') {
              next[next.length - 1] = { ...lastMsg, links, isStreaming: false };
            }
            return next;
          });
          setLoading(false);
        }
      );
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "I encountered an error. Please try again later." }]);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white' 
                  : 'bg-white/10 text-cyan-400 border border-white/10'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              
              <div className="space-y-2">
                <div className={`p-5 rounded-[2rem] text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-cyan-500/10 border border-cyan-500/30 text-white rounded-tr-none' 
                    : 'glass text-slate-200 rounded-tl-none'
                } relative overflow-hidden`}>
                  {msg.isStreaming && (
                    <div className="absolute top-0 left-0 h-[2px] w-full bg-cyan-500/20 overflow-hidden">
                      <div className="h-full bg-cyan-500 animate-[loading_1s_infinite]"></div>
                    </div>
                  )}
                  {msg.content || (msg.isStreaming ? 'Thinking...' : '')}
                </div>

                {msg.links && msg.links.length > 0 && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
                    {msg.links.map((link, lIdx) => (
                      <a 
                        key={lIdx}
                        href={link.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border-white/5 text-[10px] font-bold text-cyan-400 hover:bg-white/10 transition-all"
                      >
                        <Globe size={12} />
                        {link.title || 'Source'}
                        <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="relative mt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about recipes, ingredients, or food tips..."
          className="w-full bg-white/5 border border-white/10 rounded-3xl pl-6 pr-16 py-5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600 text-sm shadow-2xl"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="absolute right-3 top-3 bottom-3 aspect-square bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:grayscale active:scale-95 shadow-lg shadow-cyan-500/20"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>
      
      <div className="flex justify-center">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
          Powered by Gemini Flash 2.5
        </p>
      </div>
    </div>
  );
};

export default Chat;
