"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingCart,
  Search,
  MoreVertical,
  CheckCircle2,
  Truck,
  Clock,
  Package,
  X,
} from "lucide-react";
import type { OrderDTO } from '@/services/order.service'

function StatusBadge({ status }: { status: OrderDTO['status'] }) {
  if (status === 'DELIVERED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="h-3 w-3" />
        Delivered
      </span>
    );
  }
  if (status === 'SHIPPED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <Truck className="h-3 w-3" />
        Shipped
      </span>
    );
  }
  if (status === 'PROCESSING') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="h-3 w-3" />
        Processing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
      <Package className="h-3 w-3" />
      Pending
    </span>
  );
}

function OrderDetailModal({ order, onClose }: { order: OrderDTO; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!mounted) return null;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Order #', value: <span className="font-mono">{order.orderNumber}</span> },
    { label: 'Customer', value: order.customerName },
    { label: 'Assigned to', value: order.assignedTo },
    { label: 'Items', value: order.items.reduce((s, i) => s + i.quantity, 0) },
    { label: 'Total', value: `$${order.total.toFixed(2)}` },
    { label: 'Date', value: new Date(order.createdAt).toLocaleDateString() },
  ];

  return createPortal(
    <>
    <div className="fixed top-40 w-full px-2 z-50 flex items-end sm:items-center justify-center">
      <button
        onClick={onClose}
        aria-label="Close"
        className="fixed top-40 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="relative w-full min-h-full sm:max-w-md bg-white rounded-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 pr-8">
            <h2 className="text-xl font-bold text-gray-900 wrap-break-words">{order.customerName}</h2>
          </div>
          <StatusBadge status={order.status} />
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3 text-sm">
                <dt className="text-gray-500">{row.label}</dt>
                <dd className="font-medium text-gray-900 text-right">{row.value}</dd>
              </div>
            ))}
          </div>
          {/* Список позиций заказа */}
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Items</div>
            <ul className="space-y-1.5">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate pr-3">{i.product.name}</span>
                  <span className="font-medium text-gray-900 shrink-0">×{i.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div
        className="absolute z-40 top-0 bottom-0 w-full h-[3000px] bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
    </>
    ,
    document.body
  );
}

export default function OrdersClient({ orders }: { orders: OrderDTO[] }) {
  const [selected, setSelected] = useState<OrderDTO | null>(null);

  return (
    <div className="p-2 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-[#1a1a1a]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage outbound orders, pick lists, and shipment tracking.
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap w-full sm:w-auto">
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

      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => setSelected(order)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center justify-between gap-3 active:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="font-medium text-gray-900 truncate">
                {order.customerName.length > 18 ? order.customerName.slice(0, 18) + '…' : order.customerName}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={order.status} />
                <span className="text-[10px] text-gray-400 font-mono truncate">{order.orderNumber}</span>
              </div>
            </div>
            <div className="font-bold text-sm text-gray-900 whitespace-nowrap shrink-0">
              ${order.total.toFixed(2)}
            </div>
          </button>
        ))}
      </div>

      <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
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
                <tr
                  key={order.id}
                  onClick={() => setSelected(order)}
                  className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs font-bold text-gray-900 bg-gray-100 border border-gray-200 inline-block px-1.5 py-0.5 rounded">
                      {order.orderNumber}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(order); }}
                      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <OrderDetailModal order={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}