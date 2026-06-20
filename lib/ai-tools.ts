import { Type, type FunctionDeclaration } from "@google/genai";

export const depotTools: FunctionDeclaration[] = [
  {
    name: "getAllProductsByTenant",
    description:
      "Get all warehouse products: on-hand quantity, price, category, location " +
      "and the low-stock threshold (lowStockAt). " +
      "Use this for any question about availability, stock levels or prices.",
  },
  {
    name: "createProduct",
    description:
      "Create a new product (master data). Stock is added separately via an " +
      "inbound (IN) movement, not here — a new product starts at quantity 0.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Product name" },
        sku: { type: Type.STRING, description: "Unique stock-keeping unit (SKU)" },
        category: { type: Type.STRING, description: "Product category" },
        location: { type: Type.STRING, description: "Storage location in the warehouse" },
        price: { type: Type.NUMBER, description: "Unit price" },
        lowStockAt: { type: Type.NUMBER, description: "Low-stock threshold (default 10)" },
      },
      required: ["name", "sku", "price"],
    },
  },
  {
    name: "getAllByTenant",
    description: "Get all orders for the tenant: number, customer, status, line items and total.",
  },
  {
    name: "getAllIntakesByTenant",
    description: "Get all intakes (inbound deliveries) for the tenant: number, supplier, status, line items and total.",
  },
  {
    name: "createOrder",
    description:
      "Create an order. IMPORTANT: first call getAllProductsByTenant, match the " +
      "products by name, take their exact SKUs and check there is enough stock. " +
      "Pass the SKU (NOT the name) to createOrder. Never invent a SKU. " +
      "The order is created in AWAITING_PAYMENT status and stock is NOT dispatched " +
      "yet — the customer must pay first. createOrder ALREADY generates a Stripe " +
      "payment link automatically and returns it as data.checkoutUrl: when it is " +
      "present, ALWAYS confirm the order was created and show that exact link to " +
      "the user so they can pay. Treat the order as successfully created whenever " +
      "data.id is returned, even if data.checkoutUrl is null (in that case tell " +
      "the user the order is created but the payment link could not be generated). " +
      "You do NOT need to call createOrderCheckout after createOrder.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: "Customer name" },
        products: {
          type: Type.ARRAY,
          description: "Order line items",
          items: {
            type: Type.OBJECT,
            properties: {
              sku: { type: Type.STRING, description: "Product SKU from getAllProductsByTenant" },
              quantity:  { type: Type.NUMBER, description: "Quantity" },
            },
            required: ["sku", "quantity"],
          },
        },
      },
      required: ["customerName", "products"],
    },
  },
  {
    name: "createIntake",
    description:
      "Create an intake. IMPORTANT: first call getAllProductsByTenant, match the " +
      "products by name, take their exact SKUs and check there is enough stock. " +
      "Pass the SKU (NOT the name) to createOrder. Never invent a SKU. ",
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: "Customer name" },
        products: {
          type: Type.ARRAY,
          description: "Intake line items",
          items: {
            type: Type.OBJECT,
            properties: {
              sku: { type: Type.STRING, description: "Product SKU from getAllProductsByTenant" },
              quantity:  { type: Type.NUMBER, description: "Quantity" },
            },
            required: ["sku", "quantity"],
          },
        },
      },
      required: ["customerName", "products"],
    },
  },
  {
    name: "createOrderCheckout",
    description:
      "Create a Stripe Checkout payment link for an existing unpaid order. " +
      "Returns a hosted URL the customer can open to pay. Use the order id " +
      "(NOT the order number) from createOrder or getAllByTenant. Once the " +
      "payment succeeds the order is marked paid and its stock is dispatched.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        orderId: { type: Type.STRING, description: "Order id from createOrder or getAllByTenant" },
      },
      required: ["orderId"],
    },
  },
  {
    name: "getAnalytics",
    description:
      "Get warehouse analytics: revenue, inventory valuation, top products, " +
      "stock movement summary and low-stock items.",
  },
];
