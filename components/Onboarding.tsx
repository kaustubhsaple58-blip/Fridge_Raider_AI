
import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { extractPreferences } from '../geminiService';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface OnboardingProps {
  onComplete: (prefs: UserPreferences) => void;
  initialText: string;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, initialText }) => {
  const [text, setText] = useState(initialText);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const tags = await extractPreferences(text);
      onComplete({ tags, rawText: text });
    } catch (err) {
      console.error(err);
      onComplete({ tags: [], rawText: text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-cyan-500/30 text-cyan-400 text-sm font-bold uppercase tracking-widest">
          <Sparkles size={16} />
          Smart Setup
        </div>
        <h2 className="text-5xl font-extrabold tracking-tight">Tell us about your <span className="text-cyan-400">Diet.</span></h2>
        <p className="text-slate-400 text-lg">Are you vegan? Lactose intolerant? Don't like mushrooms? Just tell the AI and we'll filter everything for you.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full relative group">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="I'm vegan, love spicy food but I'm allergic to peanuts..."
          className="w-full h-40 bg-white/5 border border-white/10 rounded-3xl p-6 text-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600 resize-none"
        />
        <button
          disabled={loading}
          type="submit"
          className="absolute bottom-4 right-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-2xl shadow-xl shadow-cyan-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <>Next <ArrowRight size={20} /></>}
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4 w-full">
        <ExampleCard text="I'm vegetarian and hate coriander." onClick={() => setText("I'm vegetarian and hate coriander.")} />
        <ExampleCard text="High protein diet, no processed sugar." onClick={() => setText("High protein diet, no processed sugar.")} />
      </div>
    </div>
  );
};

const ExampleCard = ({ text, onClick }: { text: string, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="glass p-4 rounded-2xl border-white/5 cursor-pointer hover:bg-white/10 transition-all"
  >
    <p className="text-slate-400 text-sm italic">"{text}"</p>
  </div>
);

export default Onboarding;
