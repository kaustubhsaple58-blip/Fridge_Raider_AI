
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string; // 'g', 'ml', 'pcs'
  expiryDate: string;
}

export interface UserPreferences {
  tags: string[];
  rawText: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
  }[];
  steps: string[];
  rating: number;
}

export interface MealPlanDay {
  day: number;
  breakfast: Recipe;
  lunch: Recipe;
  dinner: Recipe;
}

export type Tab = 'FRIDGE' | 'RECIPES' | 'PLANNER' | 'CHAT' | 'ONBOARDING';
