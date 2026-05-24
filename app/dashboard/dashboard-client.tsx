"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  ArrowLeftRight,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ChevronRight
} from "lucide-react";
import type { DashboardStats } from '@/services/dashboard.service'

function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

export default function DashboardClient({ stats }: { stats: DashboardStats | null }) {
  if (!stats) return <div className="p-8">Failed to load dashboard</div>

  const maxCount = Math.max(...stats.weeklyActivity.map(d => d.count), 1)

  const kpis = [
    { 
      title: "Today's Sales", 
      value: `$${stats.todaySales.toFixed(2)}`, 
      change: "+8.2%", 
      icon: DollarSign, 
      color: "text-green-600" 
    },
    { 
      title: "Active Products", 
      value: `${stats.totalProducts} items`, 
      change: "In warehouse", 
      icon: Package, 
      color: "text-blue-600" 
    },
    { 
      title: "Orders to Fulfill", 
      value: `${stats.pendingOrders} pending`, 
      change: "Awaiting processing", 
      icon: ShoppingCart, 
      color: "text-amber-600" 
    },
    { 
      title: "Stock Movements", 
      value: `${stats.todayMovements} transfers`, 
      change: "Last 24 hours", 
      icon: ArrowLeftRight, 
      color: "text-purple-600" 
    },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-[#1a1a1a]">
      
      <div className="border-b pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back! Here is an operational overview of your warehouse today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          System Updated: Just Now
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-start justify-between hover:border-gray-300 transition-colors">
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">
                  {kpi.title}
                </span>
                <span className="text-2xl font-bold block">{kpi.value}</span>
                <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                  {kpi.change.startsWith('+') && <ArrowUpRight className="h-3 w-3" />}
                  {kpi.change}
                </span>
              </div>
              <div className={`p-3 bg-gray-50 rounded-lg border border-gray-100 ${kpi.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-500" />
              Recent Operations Live-Feed
            </h2>
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
              Real-time Stream
            </span>
          </div>

          <div className="space-y-4">
            {stats.recentActivities.map((act) => (
              <div key={act.id} className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl transition-all group">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    act.type === 'order' 
                      ? 'bg-green-500' 
                      : act.type === 'movement' 
                      ? 'bg-purple-500' 
                      : 'bg-amber-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{act.text}</p>
                    <span className="text-xs text-gray-400 block mt-0.5">
                      {timeAgo(act.time)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2 flex-shrink-0">
                  {act.amount !== null && (
                    <span className="text-sm font-bold text-gray-900">
                      ${act.amount.toFixed(2)}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-gray-500" />
              Weekly Warehouse Load
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Total operations (IN + OUT) per day
            </p>
          </div>

          <div className="flex items-end justify-between h-44 pt-4 px-2">
            {stats.weeklyActivity.map((day, index) => {
              const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0
              return (
                <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                  <span className="text-[10px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-gray-900 text-white px-1 rounded mb-1">
                    {day.count}
                  </span>
                  <div 
                    className="w-full max-w-[24px] bg-black group-hover:bg-gray-800 rounded-t transition-all duration-300"
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                  <span className="text-xs font-medium text-gray-400 mt-1">{day.day}</span>
                </div>
              )
            })}
          </div>

          <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
            <span>Peak Day:</span>
            <span className="font-bold text-black">
              {stats.weeklyActivity.reduce((a, b) => a.count > b.count ? a : b).day} ({Math.max(...stats.weeklyActivity.map(d => d.count))} actions)
            </span>
          </div>
        </div>

      </div>

    </div>
  )
}