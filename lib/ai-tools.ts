// lib/ai-tools.ts
import { Type } from "@google/genai";

export const depotTools = [
  {
    name: "get_inventory",
    description: "Получить остатки товара на складе",
    parameters: {
      type: Type.OBJECT, // или просто "OBJECT"
      properties: {
        productId: { type: Type.STRING, description: "ID товара" },
      },
      required: ["productId"],
    },
  },
  // ...остальные инструменты
];