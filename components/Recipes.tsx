
import React, { useState } from 'react';
import { InventoryItem, UserPreferences, Recipe } from '../types';
import { generateRecipes } from '../geminiService';
import { Star, Clock, Flame, CheckCircle2, Loader2, RefreshCw, ChefHat, Utensils } from 'lucide-react';

interface RecipesProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  preferences: UserPreferences;
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
}

const Recipes: React.FC<RecipesProps> = ({ inventory, setInventory, preferences, recipes, setRecipes }) => {
  const [loading, setLoading] = useState(false);
  const [cooking, setCooking] = useState<string | null>(null);

  const fetchRecipes = async () => {
    if (inventory.length === 0) return;
    setLoading(true);
    const data = await generateRecipes(inventory, preferences);
    setRecipes(data);
    setLoading(false);
  };

  const handleCookThis = (recipe: Recipe) => {
    setCooking(recipe.id);
    
    setTimeout(() => {
      setInventory(prev => {
        const next = [...prev];
        recipe.ingredients.forEach(needed => {
          const index = next.findIndex(item => item.name.toLowerCase() === needed.name.toLowerCase());
          if (index !== -1) {
            const currentItem = next[index];
            let remaining = currentItem.quantity;
            let neededAmount = needed.amount;
            if (currentItem.unit === 'kg' && needed.unit === 'g') neededAmount /= 1000;
            if (currentItem.unit === 'g' && needed.unit === 'kg') neededAmount *= 1000;
            remaining -= neededAmount;
            if (remaining <= 0) {
              next.splice(index, 1);
            } else {
              next[index] = { ...currentItem, quantity: Math.round(remaining * 100) / 100 };
            }
          }
        });
        return next;
      });
      setCooking(null);
    }, 1500);
  };

  if (inventory.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
        <ChefHat size={64} className="mb-4" />
        <h3 className="text-2xl font-bold">No Ingredients found</h3>
        <p>Add food to your fridge to see recipe ideas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">AI Suggestions</h2>
          <p className="text-slate-400">Recipes tailored to your inventory</p>
        </div>
        <button 
          onClick={fetchRecipes}
          disabled={loading}
          className="p-3 rounded-2xl glass hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
        {loading || (recipes.length === 0 && inventory.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 glass rounded-3xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="glass p-6 rounded-[2rem] border-white/5 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-300">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-black tracking-tight leading-tight w-2/3">{recipe.name}</h3>
                    <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">
                      <Star size={14} fill="currentColor" /> {recipe.rating}
                    </div>
                  </div>

                  <div className="flex gap-4 mb-6">
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <Clock size={14} /> 25 MIN
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <Flame size={14} /> EASY
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Ingredients Needed</p>
                    <div className="flex flex-wrap gap-2">
                      {recipe.ingredients.map((ing, idx) => (
                        <span key={idx} className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-sm text-slate-300">
                          {ing.amount}{ing.unit} {ing.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Cooking Steps</p>
                    <ul className="space-y-2">
                      {recipe.steps.map((step, idx) => (
                        <li key={idx} className="text-sm text-slate-400 flex gap-2">
                          <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button 
                  onClick={() => handleCookThis(recipe)}
                  disabled={cooking === recipe.id}
                  className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                    cooking === recipe.id 
                      ? 'bg-emerald-500 text-slate-900 scale-95' 
                      : 'bg-white text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {cooking === recipe.id ? <><CheckCircle2 /> Cooked!</> : <><Utensils size={20} /> Cook This</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipes;
