
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { validateFoodItem } from '../geminiService';
import { Plus, X, AlertTriangle, Search, Loader2 } from 'lucide-react';

interface FridgeProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

const Fridge: React.FC<FridgeProps> = ({ inventory, setInventory }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: 'g', expiry: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.quantity || !newItem.expiry) return;
    
    setLoading(true);
    setError('');
    
    const validation = await validateFoodItem(newItem.name);
    
    if (!validation.isValid) {
      setError("food don't exist");
      setLoading(false);
      return;
    }

    const item: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name,
      category: validation.category,
      quantity: parseFloat(newItem.quantity),
      unit: newItem.unit,
      expiryDate: newItem.expiry
    };

    setInventory([...inventory, item]);
    setNewItem({ name: '', quantity: '', unit: 'g', expiry: '' });
    setIsAdding(false);
    setLoading(false);
  };

  const deleteItem = (id: string) => {
    setInventory(inventory.filter(i => i.id !== id));
  };

  const getExpiryColor = (dateStr: string) => {
    const today = new Date();
    const expiry = new Date(dateStr);
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff <= 3) return 'border-red-500/50 bg-red-500/10 text-red-400';
    if (diff <= 7) return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
    return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black">My Fridge</h2>
          <p className="text-slate-400">{inventory.length} items tracked</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-white text-slate-900 font-bold px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-200 transition-all shadow-lg active:scale-95"
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
          {isAdding ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddItem} className="glass p-6 rounded-3xl border-cyan-500/30 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="col-span-1 md:col-span-1">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 ml-1">Food Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Tomato"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
             <div className="flex-1">
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 ml-1">Qty</label>
                <input 
                  required
                  type="number" 
                  placeholder="500"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-all"
                />
             </div>
             <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 ml-1">Unit</label>
                <select 
                  value={newItem.unit}
                  onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-all appearance-none"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  <option value="pcs">pcs</option>
                </select>
             </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 ml-1">Expiry</label>
            <input 
              required
              type="date" 
              value={newItem.expiry}
              onChange={(e) => setNewItem({...newItem, expiry: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
          <div className="flex items-end">
            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Confirm'}
            </button>
          </div>
          {error && <p className="col-span-full text-red-500 text-xs font-bold mt-2 flex items-center gap-1"><AlertTriangle size={14} /> {error}</p>}
        </form>
      )}

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {inventory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 text-center">
            <Search size={48} className="mb-4" />
            <p className="text-xl font-bold">Your fridge is empty</p>
            <p>Start by adding some ingredients</p>
          </div>
        ) : (
          inventory.map((item) => (
            <div key={item.id} className={`glass group p-4 rounded-2xl border flex items-center justify-between transition-all hover:translate-x-1 ${getExpiryColor(item.expiryDate)}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl font-bold">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">{item.name}</h4>
                  <p className="text-xs opacity-70 font-medium uppercase tracking-widest">{item.category} • Exp: {item.expiryDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xl font-black text-white">{item.quantity} {item.unit}</p>
                  <p className="text-[10px] font-bold uppercase opacity-60">Remaining</p>
                </div>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Fridge;
