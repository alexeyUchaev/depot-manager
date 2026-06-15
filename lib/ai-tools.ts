// lib/ai-tools.ts
import { Type, type FunctionDeclaration } from "@google/genai";

// ВАЖНО: имена инструментов должны совпадать с case-ами в lib/ai-executor.ts
export const depotTools: FunctionDeclaration[] = [
  {
    name: "getAllProductsByTenant",
    description:
      "Получить список всех товаров на складе: остатки (quantity), цены (price), " +
      "категории, расположение и порог низкого остатка (lowStockAt). " +
      "Используй для любых вопросов про наличие, остатки и цены.",
  },
  {
    name: "createProduct",
    description: "Создать новый товар на складе.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Название товара" },
        sku: { type: Type.STRING, description: "Уникальный артикул (SKU)" },
        category: { type: Type.STRING, description: "Категория товара" },
        location: { type: Type.STRING, description: "Место хранения на складе" },
        price: { type: Type.NUMBER, description: "Цена за единицу" },
        quantity: { type: Type.NUMBER, description: "Начальное количество (по умолчанию 0)" },
        lowStockAt: { type: Type.NUMBER, description: "Порог низкого остатка (по умолчанию 10)" },
      },
      required: ["name", "sku", "price"],
    },
  },
  {
    name: "getAllByTenant",
    description: "Get all order by tenant"
  },
  {
   name:"createOrder",
   description: "Create new order",   
   parameters: {
    type: Type.OBJECT,
    description: "Use tool: getAllProductsByTenant to find product and make sure there is enough items to proceed",
    properties:{
      products: { 
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties:{
            productName: {type: Type.STRING, description: "Product name"},
            quantity: { type: Type.STRING, description: "quantity"}
          },   required: ["productName", "quantity"],
        },
      }
    }
   }
  }
];