"use client";

import React, { useState } from 'react';
import {
  PackagePlus, Search, MoreVertical,
  CheckCircle2, Truck, Clock, PackageCheck, XCircle
} from "lucide-react";
import type { IntakeDTO } from '@/services/intake.service';
import { DetailModal } from '@/components/detail-modal';
import { DemoModal } from '@/components/demo-modal';

function StatusBadge({ status }: { status: string }) {
  if (status === 'IN_TRANSIT') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900">
      <Truck className="h-3 w-3" /> Shipped
    </span>
  );
  if (status === 'ARRIVED') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900">
      <PackageCheck className="h-3 w-3" /> ARRIVED
    </span>
  );
  if (status === 'ACCEPTED') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900">
      <CheckCircle2 className="h-3 w-3" /> ACCEPTED
    </span>
  );
  if (status === 'REJECTED') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900">
      <XCircle className="h-3 w-3" /> REJECTED
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

export default function IntakeClient({ intakes }: { intakes: IntakeDTO[] }) {
  const [selected, setSelected] = useState<IntakeDTO | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="p-2 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Intakes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage outbound intakes, pick lists, and shipment tracking.
          </p>
        </div>
        <button onClick={() => setDemoOpen(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg text-sm font-medium transition-colors w-full sm:w-auto">
          <PackagePlus className="h-4 w-4" /> Create Intake
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border rounded-xl p-4 shadow-sm">
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"><Search className="h-4 w-4" /></span>
          <input type="text" placeholder="Search by Order ID, Customer, or Product..."
            className="w-full pl-9 pr-3 py-2 bg-muted border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex items-center justify-between md:justify-end gap-2 text-xs text-muted-foreground font-medium">
          Total Orders: <span className="text-sm font-bold text-foreground bg-muted px-2 py-0.5 rounded ml-1">{intakes.length}</span>
        </div>
      </div>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {intakes.map((intake) => (
          <button key={intake.id} onClick={() => setSelected(intake)}
            className="w-full text-left bg-card border rounded-lg p-3 shadow-sm flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="font-mono text-xs font-bold text-foreground">{intake.intakeNumber}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {intake.customerName.length > 18 ? intake.customerName.slice(0, 18) + '…' : intake.customerName}
              </div>
            </div>
            <div className="font-bold text-foreground shrink-0">${intake.total.toFixed(2)}</div>
          </button>
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden md:block bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">Intake ID / Date</th>
                <th className="px-6 py-4">Supplier </th>
                <th className="px-6 py-4 hidden lg:table-cell">Items</th>
                <th className="px-6 py-4 hidden 2xl:table-cell">Assigned To</th>
                <th className="px-6 py-4 hidden 2xl:table-cell">Total Amount</th>
                <th className="px-6 py-4 hidden 2xl:table-cell">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {intakes.map((intake) => (
                <tr key={intake.id} 
                  className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs font-bold text-foreground bg-muted border inline-block px-1.5 py-0.5 rounded">{intake.intakeNumber}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(intake.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="font-medium text-foreground">{intake.customerName}</div></td>
                  <td className="px-6 py-4 max-w-xs hidden lg:table-cell">
                    <div className="text-foreground font-medium truncate">
                      {intake.items.map(i => `${i.product.name} ×${i.quantity}`).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden 2xl:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {intake.assignedTo.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm text-muted-foreground">{intake.assignedTo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground hidden 2xl:table-cell">${intake.total.toFixed(2)}</td>
                  <td className="px-6 py-4 hidden 2xl:table-cell"><StatusBadge status={intake.status} /></td>
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
          title={selected.intakeNumber}
          badges={<StatusBadge status={selected.status} />}
          rows={[
            { label: 'Customer', value: selected.customerName },
            { label: 'Date', value: new Date(selected.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
            { label: 'Assigned To', value: selected.assignedTo },
            { label: 'Total', value: `$${selected.total.toFixed(2)}` },
          ]}
          onClose={() => setSelected(null)}
        >
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items</div>
            <ul className="space-y-1.5">
              {selected.items.map((i, idx) => (
                <li key={idx} className="flex items-center justify-between text-sm bg-muted px-3 py-2 rounded-lg">
                  <span className="text-foreground">{i.product.name}</span>
                  <span className="font-medium text-muted-foreground">×{i.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        </DetailModal>
      )}

      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
    </div>
  );
}