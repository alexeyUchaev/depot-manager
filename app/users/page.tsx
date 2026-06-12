"use client";

import React, { useState } from 'react';
import {
  UserPlus, Search, Shield, Mail,
  MoreVertical, CheckCircle2, XCircle
} from "lucide-react";
import { DetailModal } from '@/components/detail-modal';

type UserRow = { id: number; name: string; email: string; role: string; status: string; department: string };

function roleClass(role: string) {
  if (role === 'Owner') return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900';
  if (role === 'Manager') return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900';
  return 'bg-muted text-muted-foreground border-border';
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleClass(role)}`}>
      <Shield className="h-3 w-3" /> {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return status === 'Active' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900">
      <CheckCircle2 className="h-3 w-3" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
      <XCircle className="h-3 w-3" /> Inactive
    </span>
  );
}

export default function UsersPage() {
  const [users] = useState<UserRow[]>([
    { id: 1, name: "Alexey U.", email: "alexey@techmartwholesale.com", role: "Owner", status: "Active", department: "Management" },
    { id: 2, name: "John Doe", email: "j.doe@techmartwholesale.com", role: "Manager", status: "Active", department: "Warehouse Operations" },
    { id: 3, name: "Mike Smith", email: "m.smith@techmartwholesale.com", role: "Manager", status: "Active", department: "Inventory Control" },
    { id: 4, name: "Anna Kovalsky", email: "a.kovalsky@techmartwholesale.com", role: "Staff", status: "Active", department: "Sales & Orders" },
    { id: 5, name: "Kevin Jones", email: "k.jones@techmartwholesale.com", role: "Staff", status: "Inactive", department: "Warehouse Operations" },
  ]);
  const [selected, setSelected] = useState<UserRow | null>(null);

  return (
    <div className="p-2 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user permissions, roles, and department assignments for your staff.
          </p>
        </div>
        <button
          onClick={() => alert("Demo Mode: Cannot invite users in the preview version.")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
        >
          <UserPlus className="h-4 w-4" /> Invite Member
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 bg-card border rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"><Search className="h-4 w-4" /></span>
          <input type="text" placeholder="Search by name, email or role..."
            className="w-full pl-9 pr-3 py-2 bg-muted border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Total: <span className="text-sm font-bold text-foreground bg-muted px-2 py-0.5 rounded ml-1">{users.length}</span>
        </div>
      </div>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {users.map((u) => (
          <button key={u.id} onClick={() => setSelected(u)}
            className="w-full text-left bg-card border rounded-lg p-3 shadow-sm flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted border flex items-center justify-center font-medium text-muted-foreground shrink-0">
              {u.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="font-medium text-foreground">
                {u.name.length > 18 ? u.name.slice(0, 18) + '…' : u.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{u.role}</div>
            </div>
          </button>
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden md:block bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">Name / Email</th>
                <th className="px-6 py-4 hidden lg:table-cell">Role</th>
                <th className="px-6 py-4 hidden xl:table-cell">Department</th>
                <th className="px-6 py-4 hidden xl:table-cell">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {users.map((user) => (
                <tr key={user.id}
                  className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center font-medium text-muted-foreground">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 inline" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell"><RoleBadge role={user.role} /></td>
                  <td className="px-6 py-4 text-muted-foreground text-sm hidden xl:table-cell">{user.department}</td>
                  <td className="px-6 py-4 hidden lg:table-cell"><StatusBadge status={user.status} /></td>
                  <td className="px-6 py-4 text-right ">
                    <button
                      onClick={(e) => { e.stopPropagation(); alert("Demo Mode: Action restricted."); }}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
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
        <DetailModal
          title={selected.name}
          header={
            <div className="h-14 w-14 rounded-full bg-muted border flex items-center justify-center font-semibold text-muted-foreground text-lg">
              {selected.name.split(' ').map(n => n[0]).join('')}
            </div>
          }
          badges={
            <div className="flex flex-wrap gap-2">
              <RoleBadge role={selected.role} />
              <StatusBadge status={selected.status} />
            </div>
          }
          rows={[
            { label: 'Email', value: <span className="break-all">{selected.email}</span> },
            { label: 'Department', value: selected.department },
          ]}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}