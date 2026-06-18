import * as services from "@/services";
import { DEMO_TENANT_ID, DEMO_USER_ID } from "./constants";
import { analyticsService } from "@/services/analytics.service";
import { intakeService } from "@/services/intake.service";
import { paymentService } from "@/services/payment.service";

export interface ToolArgs {
  name: string
  sku: string
  category?: string
  location?: string
  price: number
  lowStockAt?: number
  products?: { sku: string; quantity: number | string }[]
  customerName: string
  orderId: string
}

export async function executeTool(name: string, args: ToolArgs) {
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
        lowStockAt: args.lowStockAt || 10
      });

    case "getAllByTenant":
      return await services.orderService.getAllByTenant(tenantId);

    case "getAllIntakesByTenant":
    return await intakeService.getAllIntakesByTenant(tenantId);

    case "createOrder": {
      const items = [];
      for (const p of args.products ?? []) {
        const product = await services.getBySku(p.sku, tenantId);
        if (!product) {
          return { error: `Product not found: ${p.sku}` };
        }
        items.push({
          id: product.id,
          sku: product.sku,
          quantity: Number(p.quantity),
          price: product.price,
        });
      }

      const created = await services.orderService.create(tenantId, userId, {
        customerName: args.customerName,
        items,
      });

      if (created.success && created.data) {
        const checkout = await paymentService.createOrderCheckoutSession(
          tenantId,
          created.data.id
        );
        return {
          ...created,
          data: {
            ...created.data,
            checkoutUrl: checkout.success ? checkout.data.url : null,
            checkoutError: checkout.success ? undefined : checkout.error,
          },
        };
      }

      return created;
    }
    case "createOrderCheckout":
      return await paymentService.createOrderCheckoutSession(tenantId, args.orderId);

    case "getAnalytics":
    return await analyticsService.getAnalytics(tenantId)

    default:
      throw new Error(`Tool ${name} is not implemented.`);
  }
}