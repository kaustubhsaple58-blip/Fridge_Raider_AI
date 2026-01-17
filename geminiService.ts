
import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem, UserPreferences } from "./types";

/**
 * Validates if an item is a valid food item and normalizes it.
 */
export async function validateFoodItem(name: string): Promise<{ isValid: boolean, category: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Is "${name}" a valid food item or edible ingredient? Answer in JSON format with "isValid" (boolean) and "category" (string, e.g., Dairy, Vegetable, Meat, Pantry, Fruit, Other). If not food, isValid is false.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isValid: { type: Type.BOOLEAN },
          category: { type: Type.STRING }
        },
        required: ["isValid", "category"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{"isValid": false, "category": "Other"}');
  } catch (e) {
    return { isValid: false, category: "Other" };
  }
}

/**
 * Extracts preferences and diet tags from text.
 */
export async function extractPreferences(text: string): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Extract dietary preferences and restrictions from this text: "${text}". Return a JSON array of strings (tags). Example: ["Vegan", "No Nuts", "Gluten-Free"].`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Generates recipes based on inventory and preferences.
 */
export async function generateRecipes(inventory: InventoryItem[], prefs: UserPreferences) {
  const inventoryStr = inventory.map(i => `${i.quantity}${i.unit} ${i.name}`).join(", ");
  const tagsStr = prefs.tags.join(", ");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are an expert chef. Based on these ingredients: [${inventoryStr}] and dietary restrictions: [${tagsStr}], generate 3 creative recipes. 
    Strictly use only what is available in the inventory.
    Units must be in universal metric (g, ml, pcs).
    Provide JSON format: Array of objects with "id", "name", "ingredients" (Array of {name, amount, unit}), "steps" (Array of 4-5 strings), "rating" (number 1-5).`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  unit: { type: Type.STRING }
                },
                required: ["name", "amount", "unit"]
              }
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            rating: { type: Type.NUMBER }
          },
          required: ["id", "name", "ingredients", "steps", "rating"],
          propertyOrdering: ["id", "name", "ingredients", "steps", "rating"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * Generates a meal plan for a specific number of days.
 */
export async function generateMealPlan(inventory: InventoryItem[], prefs: UserPreferences, days: number = 3) {
  const inventoryStr = inventory.map(i => `${i.quantity}${i.unit} ${i.name}`).join(", ");
  const tagsStr = prefs.tags.join(", ");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Create a ${days}-day meal plan (Breakfast, Lunch, Dinner) using ONLY these ingredients: [${inventoryStr}]. Dietary tags: [${tagsStr}].
    Equalize units (1kg = 1000g, etc.) and only use available quantities.
    JSON output: Array of ${days} objects with "day" (1-${days}), "breakfast", "lunch", "dinner". Each meal should have "name", "ingredients" (Array of {name, amount, unit}), and "steps" (Array of 4-5 strings).`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.NUMBER },
            breakfast: { 
              type: Type.OBJECT, 
              properties: { 
                name: { type: Type.STRING }, 
                ingredients: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: { 
                      name: { type: Type.STRING }, 
                      amount: { type: Type.NUMBER }, 
                      unit: { type: Type.STRING } 
                    } 
                  } 
                }, 
                steps: { type: Type.ARRAY, items: { type: Type.STRING } } 
              } 
            },
            lunch: { 
              type: Type.OBJECT, 
              properties: { 
                name: { type: Type.STRING }, 
                ingredients: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: { 
                      name: { type: Type.STRING }, 
                      amount: { type: Type.NUMBER }, 
                      unit: { type: Type.STRING } 
                    } 
                  } 
                }, 
                steps: { type: Type.ARRAY, items: { type: Type.STRING } } 
              } 
            },
            dinner: { 
              type: Type.OBJECT, 
              properties: { 
                name: { type: Type.STRING }, 
                ingredients: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: { 
                      name: { type: Type.STRING }, 
                      amount: { type: Type.NUMBER }, 
                      unit: { type: Type.STRING } 
                    } 
                  } 
                }, 
                steps: { type: Type.ARRAY, items: { type: Type.STRING } } 
              } 
            }
          },
          required: ["day", "breakfast", "lunch", "dinner"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Chat with AI including Google Search tool for real-time info.
 */
export async function chatWithAI(message: string, inventory: InventoryItem[]) {
  const inventoryStr = inventory.map(i => `${i.quantity}${i.unit} ${i.name}`).join(", ");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `User message: "${message}". Context: User's fridge contains [${inventoryStr}]. You are an AI assistant for FRIDGERAIDER. If searching for recipes or current news, use the google search tool.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  try {
    const groundingLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];
    return { text: response.text, links: groundingLinks };
  } catch (e) {
    return { text: "I'm sorry, I encountered an error processing your request.", links: [] };
  }
}
