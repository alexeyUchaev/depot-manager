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
      color: "text-green-600 dark:text-green-400" 
    },
    { 
      title: "Active Products", 
      value: `${stats.totalProducts} items`, 
      change: "In warehouse", 
      icon: Package, 
      color: "text-blue-600 dark:text-blue-400" 
    },
    { 
      title: "Orders to Fulfill", 
      value: `${stats.pendingOrders} pending`, 
      change: "Awaiting processing", 
      icon: ShoppingCart, 
      color: "text-amber-600 dark:text-amber-400" 
    },
    { 
      title: "Stock Movements", 
      value: `${stats.todayMovements} transfers`, 
      change: "Last 24 hours", 
      icon: ArrowLeftRight, 
      color: "text-purple-600 dark:text-purple-400" 
    },
  ]

  return (
    <div className="max-w-7xl mx-auto pb-10 pt-6 md:pb-2 md:pt-2 space-y-4 md:space-y-8 text-foreground">
      <div className="border-b pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here is an operational overview of your warehouse today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-foreground/80  bg-muted border px-3 py-1.5 rounded-lg">
          <Clock className="h-3.5 w-3.5 text-foreground/80" />
          System Updated: Just Now
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div key={index} className="bg-card border rounded-xl p-3 md:p-6 shadow-sm flex items-start justify-between hover:border-ring/50 transition-colors">
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                  {kpi.title}
                </span>
                <span className="text-xl md:text-lg font-bold block">{kpi.value}</span>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${
                  kpi.change.startsWith('+')
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-foreground/80'
                 }`}>
                  {kpi.change.startsWith('+') && <ArrowUpRight className="h-3 w-3" />}
                  {kpi.change}
                </span>
              </div>
              <div className={`p-2 bg-muted rounded-lg border ${kpi.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Recent Operations Live-Feed
            </h2>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded">
              Real-time Stream
            </span>
          </div>
          <div className="space-y-4">
            {stats.recentActivities.map((act) => (
              <div key={act.id} className="flex items-center justify-between p-3.5 bg-muted/50 hover:bg-muted border rounded-xl transition-all group">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    act.type === 'order' 
                      ? 'bg-green-500' 
                      : act.type === 'movement' 
                      ? 'bg-purple-500' 
                      : 'bg-amber-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{act.text}</p>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {timeAgo(act.time)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2 shrink-0">
                  {act.amount !== null && (
                    <span className="text-sm font-bold text-foreground">
                      ${act.amount.toFixed(2)}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
              Weekly Warehouse Load
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total operations (IN + OUT) per day
            </p>
          </div>
          <div className="flex items-end justify-between h-44 pt-4 px-2">
            {stats.weeklyActivity.map((day, index) => {
              const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0
              return (
                <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                  <span className="text-[10px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-primary text-primary-foreground px-1 rounded mb-1">
                    {day.count}
                  </span>
                  <div 
                    className="w-full max-w-[24px] bg-primary group-hover:bg-primary/80 rounded-t transition-all duration-300"
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                  <span className="text-xs font-medium text-muted-foreground mt-1">{day.day}</span>
                </div>
              )
            })}
          </div>
          <div className="pt-2 border-t border-gray-100 text-xs text-muted-foreground flex justify-between">
            <span>Peak Day:</span>
            <span className="font-bold text-foreground">
              {stats.weeklyActivity.reduce((a, b) => a.count > b.count ? a : b).day} ({Math.max(...stats.weeklyActivity.map(d => d.count))} actions)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}