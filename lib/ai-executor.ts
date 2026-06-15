import * as services from "@/services";
import { DEMO_TENANT_ID, DEMO_USER_ID } from "./constants";
export async function executeTool(name: string, args: any) {
  const tenantId = DEMO_TENANT_ID;
  const userId = DEMO_USER_ID

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
        return await services.orderService.getAllByTenant(tenantId)
      
        case "createOrder":
        return await services.orderService.create(tenantId, userId, args.products)
    default:
      throw new Error(`Tool ${name} is not implemented.`);
  }
}