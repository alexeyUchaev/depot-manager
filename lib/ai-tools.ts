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
    description:
      "Создать новую карточку товара (справочник). Остаток создаётся отдельно " +
      "движением прихода (IN), а не здесь — новый товар стартует с остатком 0.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Название товара" },
        sku: { type: Type.STRING, description: "Уникальный артикул (SKU)" },
        category: { type: Type.STRING, description: "Категория товара" },
        location: { type: Type.STRING, description: "Место хранения на складе" },
        price: { type: Type.NUMBER, description: "Цена за единицу" },
        lowStockAt: { type: Type.NUMBER, description: "Порог низкого остатка (по умолчанию 10)" },
      },
      required: ["name", "sku", "price"],
    },
  },
  {
    name: "getAllByTenant",
    description: "Получить список всех заказов тенанта (номер, клиент, статус, позиции, сумма).",
  },
  {
    name: "getAllIntakesByTenant",
    description: "Получить список всех заказов Intakes (номер, клиент, статус, позиции, сумма).",
  },
  {
    name: "createOrder",
    description:
      "Создать заказ. ВАЖНО: сначала вызови getAllProductsByTenant, найди товары " +
      "по названию, возьми их точные id и проверь, что остатка хватает. " +
      "В createOrder передавай sku (НЕ название). Никогда не выдумывай sku.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: "Имя клиента / заказчика" },
        products: {
          type: Type.ARRAY,
          description: "Позиции заказа",
          items: {
            type: Type.OBJECT,
            properties: {
              sku: { type: Type.STRING, description: "Sku товара из getAllProductsByTenant" },
              quantity:  { type: Type.NUMBER, description: "Количество" },
            },
            required: ["sku", "quantity"],
          },
        },
      },
      required: ["customerName", "products"],
    },
  },
  {
    name: "getAnalytics",
    description: "Получи статистику по складу выдавай сразу при загрузке"
  },
];