"use client";

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import type { AnalyticsData } from '@/services/analytics.service'

export default function AnalyticsClient({ data }: { data: AnalyticsData | null }) {
  if (!data) return <div className="p-8">Failed to load analytics</div>

  const maxRevenue = Math.max(...data.monthlyRevenue.map(m => m.amount), 1)
  const totalMovements = data.movementsSummary.inUnits + data.movementsSummary.outUnits

  return (
    <div className="p-2 pb-10 md:pb-2 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 text-[#1a1a1a]">
      <div className="border-b pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Business Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time breakdown of revenue, inventory valuation, and stock performance.
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-3 shadow-sm flex items-center justify-between">
          <div className="space-y-2 min-w-0">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Gross Revenue (MTD)
            </span>
            <div className="text-xl font-bold truncate">${data.grossRevenue.toFixed(2)}</div>
            <span className={`inline-flex items-center text-xs font-medium ${data.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.revenueGrowth >= 0
                ? <ArrowUpRight className="h-3 w-3 mr-0.5" />
                : <ArrowDownRight className="h-3 w-3 mr-0.5" />
              }
              {Math.abs(data.revenueGrowth).toFixed(1)}% vs last month
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 shrink-0">
            <DollarSign className="h-5 w-5 text-gray-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-3 shadow-sm flex items-center justify-between">
          <div className="space-y-2 min-w-0">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Inventory Valuation
            </span>
            <div className="text-xl font-bold truncate">${data.inventoryValuation.toFixed(2)}</div>
            <span className="text-xs text-gray-500">Total stock asset value</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 shrink-0">
            <Package className="h-5 w-5 text-gray-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-3 shadow-sm flex items-center justify-between">
          <div className="space-y-2 min-w-0">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Total Orders (MTD)
            </span>
            <div className="text-xl font-bold truncate">{data.totalOrders} Orders</div>
            <span className="inline-flex items-center text-xs font-medium text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> This month
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 shrink-0">
            <ShoppingCart className="h-5 w-5 text-gray-500" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-500" />
              <h2 className="text-base md:text-lg font-semibold">Monthly Revenue Growth</h2>
            </div>
            <span className="text-xs font-medium text-gray-400 uppercase">USD ($)</span>
          </div>
          <div className="flex items-end justify-between h-48 md:h-64 pt-4 px-1 md:px-2 gap-1">
            {data.monthlyRevenue.map((item, index) => {
              const heightPercent = maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0
              return (
                <div key={index} className="flex flex-col items-center gap-3 flex-1 group min-w-0">
                  <span className="text-xs font-mono font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white px-1.5 py-0.5 rounded text-center mb-1">
                    ${item.amount.toFixed(0)}
                  </span>
                  <div
                    className="w-full max-w-[48px] bg-black hover:bg-gray-800 rounded-t-md transition-all duration-300"
                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                  />
                  <span className="text-[10px] md:text-xs font-medium text-gray-500 mt-1 truncate w-full text-center">{item.month}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <h2 className="text-md font-semibold">Stock Movements (MTD)</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1 text-gray-600">
                    <ArrowDownCircle className="h-3 w-3 text-green-600" />
                    Stock IN
                  </span>
                  <span className="text-gray-900 font-bold">
                    {data.movementsSummary.inUnits} units ({totalMovements > 0 ? Math.round((data.movementsSummary.inUnits / totalMovements) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-green-600 h-full"
                    style={{ width: `${totalMovements > 0 ? (data.movementsSummary.inUnits / totalMovements) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1 text-gray-600">
                    <ArrowUpCircle className="h-3 w-3 text-red-500" />
                    Stock OUT
                  </span>
                  <span className="text-gray-900 font-bold">
                    {data.movementsSummary.outUnits} units ({totalMovements > 0 ? Math.round((data.movementsSummary.outUnits / totalMovements) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full"
                    style={{ width: `${totalMovements > 0 ? (data.movementsSummary.outUnits / totalMovements) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Package className="h-4 w-4 text-gray-500" />
              <h2 className="text-md font-semibold">Top Selling Products</h2>
            </div>
            <div className="divide-y divide-gray-100 text-xs">
              {data.topProducts.map((product, index) => (
                <div key={index} className="flex justify-between py-2.5 first:pt-0 last:pb-0 gap-2">
                  <div className="min-w-0">
                    <div className="text-gray-700 font-medium truncate">{product.name}</div>
                    <div className="text-gray-400 font-mono truncate">{product.sku}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-gray-900 font-bold">{product.share}%</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${product.trend === 'up' ? 'bg-green-500' : 'bg-amber-500'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {data.lowStockProducts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 md:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-amber-200 pb-3">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <h2 className="text-md font-semibold text-amber-800">Low Stock Alerts</h2>
              </div>
              <div className="divide-y divide-amber-100 text-xs">
                {data.lowStockProducts.map((product, index) => (
                  <div key={index} className="flex justify-between py-2.5 first:pt-0 last:pb-0 gap-2">
                    <div className="min-w-0">
                      <div className="text-amber-800 font-medium truncate">{product.name}</div>
                      <div className="text-amber-600 font-mono truncate">{product.sku}</div>
                    </div>
                    <span className={`font-bold shrink-0 ${product.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {product.quantity === 0 ? 'Out of Stock' : `${product.quantity} left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}