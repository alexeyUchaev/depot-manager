"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  SlidersHorizontal,
  Search,
  Plus,
  FileText,
  User,
  X,
} from "lucide-react";
import type { MovementDTO } from '@/services/movements.service'

function TypeBadge({ type }: { type: MovementDTO['type'] }) {
  if (type === 'IN') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <ArrowDownCircle className="h-3 w-3" />
        IN
      </span>
    );
  }
  if (type === 'OUT') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <ArrowUpCircle className="h-3 w-3" />
        OUT
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <SlidersHorizontal className="h-3 w-3" />
      ADJUSTMENT
    </span>
  );
}

function MovementDetailModal({ movement, onClose }: { movement: MovementDTO; onClose: () => void }) {
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

  const operator = [movement.user.firstName, movement.user.lastName].filter(Boolean).join(' ') || '—';

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'SKU', value: <span className="font-mono">{movement.product.sku}</span> },
    {
      label: 'Quantity',
      value: (
        <span className={`font-bold ${movement.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
          {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
        </span>
      ),
    },
    { label: 'Reason', value: movement.reason ?? '—' },
    { label: 'Operator', value: operator },
    { label: 'Date', value: new Date(movement.createdAt).toLocaleDateString() },
    { label: 'Time', value: new Date(movement.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
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
            <h2 className="text-xl font-bold text-gray-900 wrap-break-words">{movement.product.name}</h2>
          </div>
          <TypeBadge type={movement.type} />
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

export default function MovementsClient({ movements }: { movements: MovementDTO[] }) {
  const [selected, setSelected] = useState<MovementDTO | null>(null);

  return (
    <div className="p-2 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-[#1a1a1a]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time audit log of all inventory changes — incoming, outgoing, and adjustments.
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          New Movement
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Filter by SKU, Product, or Operator..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <span className="text-xs font-mono text-gray-400 shrink-0">Audit Log Active</span>
      </div>
      <div className="md:hidden space-y-3">
        {movements.map((mov) => (
          <button
            key={mov.id}
            onClick={() => setSelected(mov)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center justify-between gap-3 active:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="font-medium text-gray-900 truncate">
                {mov.product.name.length > 12 ? mov.product.name.slice(0, 18) + '…' : mov.product.name}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <TypeBadge type={mov.type} />
                <span className="text-[10px] text-gray-400 font-mono truncate">
                  {new Date(mov.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
            <div className={`font-bold text-sm whitespace-nowrap shrink-0 ${mov.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
              {mov.type === 'IN' ? '+' : '-'}{mov.quantity}
            </div>
          </button>
        ))}
      </div>
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Product / SKU</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {movements.map((mov) => (
                <tr
                  key={mov.id}
                  onClick={() => setSelected(mov)}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-400">
                      {new Date(mov.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      {new Date(mov.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="font-medium text-gray-900 truncate">{mov.product.name}</div>
                    <div className="text-xs font-mono text-gray-400 mt-0.5">{mov.product.sku}</div>
                  </td>
                  <td className="px-6 py-4">
                    <TypeBadge type={mov.type} />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold text-sm ${mov.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                      {mov.type === 'IN' ? '+' : '-'}{mov.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate max-w-[180px]">{mov.reason ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      {[mov.user.firstName, mov.user.lastName].filter(Boolean).join(' ')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selected && (
        <MovementDetailModal movement={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}