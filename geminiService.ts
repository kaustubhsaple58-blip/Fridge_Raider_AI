
import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem, UserPreferences } from "./types";

/**
 * Validates if an item is a valid food item and normalizes it.
 */
export async function validateFoodItem(name: string): Promise<{ isValid: boolean, category: string }> {
  try {
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
    return JSON.parse(response.text || '{"isValid": false, "category": "Other"}');
  } catch (e) {
    console.error("Food Validation Error:", e);
    return { isValid: false, category: "Other" };
  }
}

/**
 * Extracts preferences and diet tags from text.
 */
export async function extractPreferences(text: string): Promise<string[]> {
  try {
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
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Preferences Extraction Error:", e);
    return [];
  }
}

/**
 * Generates recipes based on inventory and preferences using Flash for speed.
 */
export async function generateRecipes(inventory: InventoryItem[], prefs: UserPreferences) {
  if (inventory.length === 0) return [];
  const inventoryStr = inventory.map(i => `${i.quantity}${i.unit} ${i.name}`).join(", ");
  const tagsStr = prefs.tags.join(", ");
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Switched to Flash for speed
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
            required: ["id", "name", "ingredients", "steps", "rating"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Recipe Generation Error:", e);
    return [];
  }
}

/**
 * Generates a meal plan for a specific number of days.
 */
export async function generateMealPlan(inventory: InventoryItem[], prefs: UserPreferences, days: number = 3) {
  if (inventory.length === 0) return [];
  const inventoryStr = inventory.map(i => `${i.quantity}${i.unit} ${i.name}`).join(", ");
  const tagsStr = prefs.tags.join(", ");

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Keep Pro for better plan optimization
      contents: `Create a ${days}-day meal plan (Breakfast, Lunch, Dinner) using ONLY these ingredients: [${inventoryStr}]. Dietary tags: [${tagsStr}].
      Equalize units (e.g., 1kg = 1000g). Strictly provide all quantities in universal metric (g, ml, pcs).
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
                      },
                      required: ["name", "amount", "unit"]
                    } 
                  }, 
                  steps: { type: Type.ARRAY, items: { type: Type.STRING } } 
                },
                required: ["name", "ingredients", "steps"]
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
                      },
                      required: ["name", "amount", "unit"]
                    } 
                  }, 
                  steps: { type: Type.ARRAY, items: { type: Type.STRING } } 
                },
                required: ["name", "ingredients", "steps"]
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
                      },
                      required: ["name", "amount", "unit"]
                    } 
                  }, 
                  steps: { type: Type.ARRAY, items: { type: Type.STRING } } 
                },
                required: ["name", "ingredients", "steps"]
              }
            },
            required: ["day", "breakfast", "lunch", "dinner"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Meal Plan Error:", e);
    return [];
  }
}

/**
 * Chat with AI using streaming for faster perceived response time.
 */
export async function chatWithAIStream(
  message: string, 
  inventory: InventoryItem[], 
  onChunk: (text: string) => void,
  onComplete: (groundingLinks: any[]) => void
) {
  const inventoryStr = inventory.map(i => `${i.quantity}${i.unit} ${i.name}`).join(", ");
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: `User message: "${message}". Context: User's fridge contains [${inventoryStr}]. You are an AI assistant for FRIDGERAIDER. If searching for recipes or current news, use the google search tool.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    let fullText = "";
    let links: any[] = [];

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
      
      // Attempt to extract grounding metadata from chunks if available
      const metadata = chunk.candidates?.[0]?.groundingMetadata;
      if (metadata?.groundingChunks) {
        links = metadata.groundingChunks.map((c: any) => c.web).filter(Boolean);
      }
    }
    
    onComplete(links);
  } catch (e) {
    console.error("Chat Stream Error:", e);
    onChunk("I'm sorry, I encountered an error processing your request.");
    onComplete([]);
  }
}
