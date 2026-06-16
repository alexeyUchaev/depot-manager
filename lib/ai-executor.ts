import * as services from "@/services";
import { DEMO_TENANT_ID, DEMO_USER_ID } from "./constants";
export async function executeTool(name: string, args: any) {
  const tenantId = DEMO_TENANT_ID;
  const userId = DEMO_USER_ID;

  switch (name) {
    case "getAllProductsByTenant":
      return await services.getAllProductsByTenant(tenantId);

    case "createProduct":
      return await services.createProduct(tenantId, {
        name: args.name,
        sku: args.sku,
        category: args.category,
        location: args.location,
        price: args.price,
        quantity: args.quantity || 0,
        lowStockAt: args.lowStockAt || 10
      });

    case "getAllByTenant":
      return await services.orderService.getAllByTenant(tenantId);

    case "createOrder": {
      const items = [];
      for (const p of args.products ?? []) {
        const product = await services.getBySku(p.sku, tenantId);
        if (!product) {
          return { error: `Товар не найден: ${p.sku}` };
        }
        items.push({
          sku: p.sku,
          quantity: Number(p.quantity),
          price: product.price,
        });
      }

      return await services.orderService.create(tenantId, userId, {
        customerName: args.customerName,
        items,
      });
    }
    default:
      throw new Error(`Tool ${name} is not implemented.`);
  }
}