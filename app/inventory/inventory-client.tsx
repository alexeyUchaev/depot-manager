"use client";

import React, { useState } from 'react';
import {
  Package, Plus, Search, MapPin, Layers, AlertCircle,
  MoreVertical, Tag
} from "lucide-react";
import type { ProductDTO } from '@/services/product.service';
import { DetailModal } from '@/components/detail-modal';
import { DemoModal } from '@/components/demo-modal';

function StatusBadge({ status, quantity }: { status: string; quantity: number }) {
  if (status === 'In Stock') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900">
      <Layers className="h-3 w-3" /> In Stock ({quantity})
    </span>
  );
  if (status === 'Low Stock') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900">
      <AlertCircle className="h-3 w-3" /> Low Stock ({quantity})
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
      Out of Stock
    </span>
  );
}

export default function InventoryClient({ products }: { products: ProductDTO[] }) {
  const [selected, setSelected] = useState<ProductDTO | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="p-2 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Products Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track products, stock levels, warehouse locations, and reorder alerts.
          </p>
        </div>
        <button onClick={() => setDemoOpen(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg text-sm font-medium transition-colors w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card border rounded-xl p-4 shadow-sm">
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"><Search className="h-4 w-4" /></span>
          <input type="text" placeholder="Search by Product Name, SKU, or Category..."
            className="w-full pl-9 pr-3 py-2 bg-muted border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"><Tag className="h-4 w-4" /></span>
          <select className="w-full pl-9 pr-3 py-2 bg-muted border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none text-muted-foreground">
            <option>All Categories</option>
            <option>Electronics</option><option>Mobile</option><option>Accessories</option><option>Audio</option>
          </select>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-2 text-xs text-muted-foreground font-medium">
          Total Items: <span className="text-sm font-bold text-foreground bg-muted px-2 py-0.5 rounded ml-1">{products.length}</span>
        </div>
      </div>
      <div className="md:hidden space-y-2">
        {products.map((product) => (
          <button key={product.id} onClick={() => setSelected(product)}
            className="w-full text-left bg-card border rounded-lg p-3 shadow-sm flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="font-semibold text-foreground">
                {product.name.length > 18 ? product.name.slice(0, 18) + '…' : product.name}
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-1">{product.sku}</div>
            </div>
            <div className="font-semibold text-foreground shrink-0">${product.price.toFixed(2)}</div>
          </button>
        ))}
      </div>
      <div className="hidden md:block bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">Product / SKU</th>
                <th className="px-6 py-4 hidden xl:table-cell">Category</th>
                <th className="px-6 py-4 hidden xl:table-cell">Warehouse Location</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 hidden xl:table-cell">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {products.map((product) => (
                <tr key={product.id}
                  className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 max-w-xs">
                    <div className="font-semibold text-foreground truncate">{product.name}</div>
                    <div className="text-xs font-mono text-muted-foreground mt-1 bg-muted inline-block px-1.5 py-0.5 rounded border">{product.sku}</div>
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted text-muted-foreground border font-medium">
                      <Package className="h-3 w-3" /> {product.category ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell">
                    <div className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {product.location ?? '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-foreground">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 hidden xl:table-cell"><StatusBadge status={product.status} quantity={product.quantity} /></td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors">
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
        <DetailModal
          title={selected.name}
          badges={<StatusBadge status={selected.status} quantity={selected.quantity} />}
          rows={[
            { label: 'SKU', value: <span className="font-mono">{selected.sku}</span> },
            { label: 'Category', value: selected.category ?? '—' },
            { label: 'Location', value: selected.location ?? '—' },
            { label: 'Price', value: `$${selected.price.toFixed(2)}` },
            { label: 'Quantity', value: selected.quantity },
          ]}
          onClose={() => setSelected(null)}
        />
      )}

      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
    </div>
  );
}