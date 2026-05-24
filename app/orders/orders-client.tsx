"use client";

import React from 'react';
import { 
  ShoppingCart, 
  Search, 
  MoreVertical,
  CheckCircle2,
  Truck,
  Clock,
  Package
} from "lucide-react";
import type { OrderDTO } from '@/services/order.service'

export default function OrdersClient({ orders }: { orders: OrderDTO[] }) {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-[#1a1a1a]">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage outbound orders, pick lists, and shipment tracking.
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap self-start sm:self-center">
          <ShoppingCart className="h-4 w-4" />
          Create Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input 
            type="text" 
            placeholder="Search by Order ID, Customer, or Product..." 
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div className="flex items-center justify-between md:justify-end gap-2 text-xs text-gray-400 font-medium">
          Total Orders: <span className="text-sm font-bold text-black bg-gray-100 px-2 py-0.5 rounded ml-1">{orders.length}</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Order ID / Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                  
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs font-bold text-gray-900 bg-gray-100 border border-gray-200 inline-block px-1.5 py-0.5 rounded">
                      {order.orderNumber}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{order.customerName}</div>
                  </td>
                  
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-gray-800 font-medium truncate">
                      {order.items.map(i => `${i.product.name} ×${i.quantity}`).join(', ')}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                        {order.assignedTo.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm text-gray-700">{order.assignedTo}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ${order.total.toFixed(2)}
                  </td>
                  
                  <td className="px-6 py-4">
                    {order.status === 'DELIVERED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Delivered
                      </span>
                    )}
                    {order.status === 'SHIPPED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Truck className="h-3 w-3" />
                        Shipped
                      </span>
                    )}
                    {order.status === 'PROCESSING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="h-3 w-3" />
                        Processing
                      </span>
                    )}
                    {order.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        <Package className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}