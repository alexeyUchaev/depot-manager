"use client";

import React from 'react';
import { 
  ArrowDownCircle,
  ArrowUpCircle,
  SlidersHorizontal,
  Search, 
  Plus,
  FileText, 
  User,
} from "lucide-react";
import type { MovementDTO } from '@/services/movements.service'

export default function MovementsClient({ movements }: { movements: MovementDTO[] }) {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-[#1a1a1a]">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time audit log of all inventory changes — incoming, outgoing, and adjustments.
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap self-start sm:self-center">
          <Plus className="h-4 w-4" />
          New Movement
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input 
            type="text" 
            placeholder="Filter by SKU, Product, or Operator..." 
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <span className="text-xs font-mono text-gray-400">Audit Log Active</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
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
                <tr key={mov.id} className="hover:bg-gray-50/50 transition-colors">
                  
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-400">
                      {new Date(mov.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      {new Date(mov.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 max-w-xs">
                    <div className="font-medium text-gray-900 truncate">{mov.product.name}</div>
                    <div className="text-xs font-mono text-gray-400 mt-0.5">{mov.product.sku}</div>
                  </td>
                  
                  <td className="px-6 py-4">
                    {mov.type === 'IN' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <ArrowDownCircle className="h-3 w-3" />
                        IN
                      </span>
                    )}
                    {mov.type === 'OUT' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <ArrowUpCircle className="h-3 w-3" />
                        OUT
                      </span>
                    )}
                    {mov.type === 'ADJUSTMENT' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <SlidersHorizontal className="h-3 w-3" />
                        ADJUSTMENT
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`font-bold text-sm ${
                      mov.type === 'IN' ? 'text-green-600' : 'text-red-600'
                    }`}>
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

    </div>
  );
}