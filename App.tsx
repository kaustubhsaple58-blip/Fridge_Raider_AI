
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, UserPreferences, Tab, Recipe, MealPlanDay } from './types';
import Onboarding from './components/Onboarding';
import Fridge from './components/Fridge';
import Recipes from './components/Recipes';
import Planner from './components/Planner';
import Chat from './components/Chat';
import { LayoutGrid, ChefHat, CalendarDays, MessageSquare, Utensils, RefreshCw } from 'lucide-react';
import { generateRecipes, generateMealPlan } from './geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('ONBOARDING');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({ tags: [], rawText: '' });
  
  // Shared global states for faster tab loading
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [planDays, setPlanDays] = useState(3);

  // Refs to track if data needs refreshing
  const lastPrefetchInventoryStr = useRef("");

  // Persistence simulation
  useEffect(() => {
    const savedInventory = localStorage.getItem('fridge_inventory');
    const savedPrefs = localStorage.getItem('fridge_preferences');
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedPrefs) {
        const parsedPrefs = JSON.parse(savedPrefs);
        setPreferences(parsedPrefs);
        if (parsedPrefs.tags.length > 0) setActiveTab('FRIDGE');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fridge_inventory', JSON.stringify(inventory));
    // Check if we should prefetch
    const currentInvStr = JSON.stringify(inventory);
    if (currentInvStr !== lastPrefetchInventoryStr.current && inventory.length > 0) {
      prefetchData();
    }
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('fridge_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const prefetchData = async () => {
    lastPrefetchInventoryStr.current = JSON.stringify(inventory);
    setIsSyncing(true);
    try {
      // Run both in parallel for speed
      const [newRecipes, newPlan] = await Promise.all([
        generateRecipes(inventory, preferences),
        generateMealPlan(inventory, preferences, planDays)
      ]);
      if (newRecipes.length > 0) setRecipes(newRecipes);
      if (newPlan.length > 0) setMealPlan(newPlan);
    } catch (err) {
      console.error("Prefetch error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOnboardingComplete = (prefs: UserPreferences) => {
    setPreferences(prefs);
    setActiveTab('FRIDGE');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'ONBOARDING':
        return <Onboarding onComplete={handleOnboardingComplete} initialText={preferences.rawText} />;
      case 'FRIDGE':
        return <Fridge inventory={inventory} setInventory={setInventory} />;
      case 'RECIPES':
        return (
          <Recipes 
            inventory={inventory} 
            setInventory={setInventory} 
            preferences={preferences} 
            recipes={recipes}
            setRecipes={setRecipes}
          />
        );
      case 'PLANNER':
        return (
          <Planner 
            inventory={inventory} 
            preferences={preferences} 
            plan={mealPlan} 
            setPlan={setMealPlan} 
            selectedDays={planDays}
            setSelectedDays={setPlanDays}
          />
        );
      case 'CHAT':
        return <Chat inventory={inventory} preferences={preferences} />;
      default:
        return <Fridge inventory={inventory} setInventory={setInventory} />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-white">
      {/* Background Blobs */}
      <div className="blob top-[-10%] left-[-10%] animate-pulse-slow"></div>
      <div className="blob bottom-[-10%] right-[-10%] bg-blue-500/10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      <div className="blob top-[40%] left-[60%] bg-cyan-500/10 animate-pulse-slow" style={{ animationDelay: '4s' }}></div>

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10 flex flex-col h-screen">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tighter flex items-center gap-2">
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">FRIDGERAIDER</span>
              </h1>
              <p className="text-slate-400 font-medium">Your Antifood Wastage Warrior</p>
            </div>
            {isSyncing && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-cyan-400 animate-pulse">
                <RefreshCw size={12} className="animate-spin" />
                Updating AI Intelligence...
              </div>
            )}
          </div>
          
          {activeTab !== 'ONBOARDING' && (
            <button 
                onClick={() => setActiveTab('ONBOARDING')}
                className="px-4 py-2 rounded-full glass hover:bg-white/10 transition-all text-sm font-semibold"
            >
                Edit Preferences
            </button>
          )}
        </header>

        <main className="flex-1 overflow-hidden">
          {renderContent()}
        </main>

        {activeTab !== 'ONBOARDING' && (
          <nav className="mt-8 mb-4">
            <div className="glass-dark rounded-3xl p-2 flex justify-around items-center max-w-lg mx-auto border border-white/10 shadow-2xl">
              <NavButton 
                active={activeTab === 'FRIDGE'} 
                onClick={() => setActiveTab('FRIDGE')} 
                icon={<LayoutGrid size={20} />} 
                label="Fridge" 
              />
              <NavButton 
                active={activeTab === 'RECIPES'} 
                onClick={() => setActiveTab('RECIPES')} 
                icon={<ChefHat size={20} />} 
                label="Recipes" 
              />
              <NavButton 
                active={activeTab === 'PLANNER'} 
                onClick={() => setActiveTab('PLANNER')} 
                icon={<CalendarDays size={20} />} 
                label="Planner" 
              />
              <NavButton 
                active={activeTab === 'CHAT'} 
                onClick={() => setActiveTab('CHAT')} 
                icon={<MessageSquare size={20} />} 
                label="AI" 
              />
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
      active 
        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default App;
