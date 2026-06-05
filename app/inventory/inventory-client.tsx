"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Package,
  Plus,
  Search,
  MapPin,
  Layers,
  AlertCircle,
  MoreVertical,
  Tag,
  X,
} from "lucide-react";
import type { ProductDTO } from '@/services/product.service'

function StatusBadge({ status, quantity }: { status: ProductDTO['status']; quantity: number }) {
  if (status === 'In Stock') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <Layers className="h-3 w-3" />
        In Stock ({quantity})
      </span>
    );
  }
  if (status === 'Low Stock') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <AlertCircle className="h-3 w-3" />
        Low Stock ({quantity})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
      Out of Stock
    </span>
  );
}

function ProductDetailModal({ product, onClose }: { product: ProductDTO; onClose: () => void }) {
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
    { label: 'SKU', value: <span className="font-mono">{product.sku}</span> },
    { label: 'Category', value: product.category ?? '—' },
    { label: 'Location', value: product.location ?? '—' },
    { label: 'Price', value: `$${product.price.toFixed(2)}` },
    { label: 'Quantity', value: product.quantity },
    { label: 'Low stock at', value: product.lowStockAt },
    { label: 'Created', value: new Date(product.createdAt).toLocaleDateString() },
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
            <h2 className="text-xl font-bold text-gray-900 wrap-break-words">{product.name}</h2>
          </div>
          <StatusBadge status={product.status} quantity={product.quantity} />
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3 text-sm">
                <dt className="text-gray-500">{row.label}</dt>
                <dd className="font-medium text-gray-900 text-right">{row.value}</dd>
              </div>
            ))}
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

export default function InventoryClient({ products }: { products: ProductDTO[] }) {
  const [selected, setSelected] = useState<ProductDTO | null>(null);

  return (
    <div className="p-2 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-[#1a1a1a]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">        
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Products Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track products, stock levels, warehouse locations, and reorder alerts.
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by Product Name, SKU, or Category..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Tag className="h-4 w-4" />
          </span>
          <select className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black appearance-none text-gray-500">
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Mobile</option>
            <option>Accessories</option>
            <option>Audio</option>
          </select>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-2 text-xs text-gray-400 font-medium">
          Total Items: <span className="text-sm font-bold text-black bg-gray-100 px-2 py-0.5 rounded ml-1">{products.length}</span>
        </div>
      </div>
      <div className="md:hidden space-y-3">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => setSelected(product)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center justify-between gap-3 active:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="font-medium text-gray-900 truncate">
                {product.name.length > 12 ? product.name.slice(0, 18) + '…' : product.name}
              </div>
              <div className="text-xs font-mono text-gray-400 mt-1 truncate">{product.sku}</div>
            </div>
            <div className="font-semibold text-gray-900 whitespace-nowrap shrink-0">
              ${product.price.toFixed(2)}
            </div>
          </button>
        ))}
      </div>
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Product / SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Warehouse Location</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {products.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => setSelected(product)}
                  className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 max-w-xs">
                    <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                    <div className="text-xs font-mono text-gray-400 mt-1 bg-gray-50 inline-block px-1.5 py-0.5 rounded border border-gray-100">
                      {product.sku}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200 font-medium">
                      <Package className="h-3 w-3" />
                      {product.category ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-700 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {product.location ?? '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={product.status} quantity={product.quantity} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(product); }}
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
        <ProductDetailModal product={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}