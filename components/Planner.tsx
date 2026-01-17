
import React, { useState, useEffect } from 'react';
import { InventoryItem, UserPreferences, MealPlanDay } from '../types';
import { generateMealPlan } from '../geminiService';
import { Calendar, ChevronDown, ChevronUp, Loader2, Sparkles, ShoppingCart, ListChecks } from 'lucide-react';

interface PlannerProps {
  inventory: InventoryItem[];
  preferences: UserPreferences;
}

const Planner: React.FC<PlannerProps> = ({ inventory, preferences }) => {
  const [plan, setPlan] = useState<MealPlanDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(3);

  const fetchPlan = async (days: number) => {
    if (inventory.length === 0) return;
    setLoading(true);
    const data = await generateMealPlan(inventory, preferences, days);
    setPlan(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlan(selectedDays);
  }, [selectedDays]);

  if (inventory.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
        <Calendar size={64} className="mb-4" />
        <h3 className="text-2xl font-bold">Inventory Empty</h3>
        <p>We need ingredients to plan your week!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black">Agentic Meal Planner</h2>
          <p className="text-slate-400">Optimized strategy to zero waste</p>
        </div>

        <div className="flex items-center gap-2 glass p-1 rounded-2xl border-white/10">
          {[1, 3, 5, 7].map(d => (
            <button
              key={d}
              onClick={() => setSelectedDays(d)}
              className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                selectedDays === d 
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
        {loading ? (
           <div className="space-y-6">
             {[1,2,3].map(i => <div key={i} className="h-64 glass rounded-[2rem] animate-pulse" />)}
           </div>
        ) : (
          plan.map((dayPlan) => (
            <div key={dayPlan.day} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-black flex items-center gap-2 text-cyan-400 sticky top-0 z-20 bg-slate-950 py-2">
                <span className="w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center text-sm font-black">0{dayPlan.day}</span>
                DAY {dayPlan.day}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MealCard title="Breakfast" meal={dayPlan.breakfast} />
                <MealCard title="Lunch" meal={dayPlan.lunch} />
                <MealCard title="Dinner" meal={dayPlan.dinner} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MealCard = ({ title, meal }: { title: string, meal: any }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass p-6 rounded-3xl border-white/5 flex flex-col transition-all hover:border-cyan-500/30">
      <div className="mb-4">
        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">{title}</span>
        <h4 className="font-bold text-lg leading-tight text-white">{meal.name}</h4>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-cyan-400">
          <ShoppingCart size={12} />
          Ingredients
        </div>
        <div className="flex flex-wrap gap-2">
          {meal.ingredients.map((ing: any, idx: number) => (
            <span key={idx} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] font-medium text-slate-300">
              {ing.amount}{ing.unit} {ing.name}
            </span>
          ))}
        </div>
      </div>

      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
           <ListChecks size={14} />
           {expanded ? 'Hide Steps' : 'Show Steps'}
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
          <ul className="space-y-3">
            {meal.steps.map((step: string, idx: number) => (
              <li key={idx} className="text-xs text-slate-400 flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold text-[10px]">{idx + 1}</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Planner;
