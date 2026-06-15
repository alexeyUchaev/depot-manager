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
    name: "createOrder",
    description:
      "Создать заказ. ВАЖНО: сначала вызови getAllProductsByTenant, найди товары " +
      "по названию, возьми их точные id и проверь, что остатка хватает. " +
      "В createOrder передавай productId (НЕ название). Никогда не выдумывай productId.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: "Имя клиента / заказчика" },
        products: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.STRING, description: "ID товара из getAllProductsByTenant" },
              quantity:  { type: Type.NUMBER, description: "Количество" },
            },
            required: ["productId", "quantity"],
          },
        },
      },
      required: ["customerName", "products"],
    },
  },
];