"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  UserPlus,
  Search,
  Shield,
  Mail,
  MoreVertical,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  department: string;
};

function getRoleBadge(role: string) {
  switch (role) {
    case "Owner":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Manager":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadge(role)}`}>
      <Shield className="h-3 w-3" />
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
      <XCircle className="h-3 w-3" />
      Inactive
    </span>
  );
}

function UserDetailModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
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
    { label: 'Email', value: <span className="font-mono break-all">{user.email}</span> },
    { label: 'Department', value: user.department },
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
          <div className="flex items-center gap-3 pr-8">
            <div className="h-10 w-10 rounded-full bg-gray-100 border flex items-center justify-center font-medium text-gray-600 shrink-0">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h2 className="text-xl font-bold text-gray-900 wrap-break-words">{user.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
          </div>
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 py-3 text-sm">
                <dt className="text-gray-500 shrink-0">{row.label}</dt>
                <dd className="font-medium text-gray-900 text-right min-w-0">{row.value}</dd>
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
    <div className="p-2 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 text-[#1a1a1a]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage user permissions, roles, and department assignments for your staff.
          </p>
        </div>
        <button
          onClick={() => alert("Demo Mode: Cannot invite users in the preview version.")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap w-full sm:w-auto"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 sm:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by name, email or role..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-medium shrink-0">
          Total Members: <span className="text-sm font-bold text-black bg-gray-100 px-2 py-0.5 rounded ml-1">{users.length}</span>
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => setSelected(user)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center gap-3 active:bg-gray-50 transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-gray-100 border flex items-center justify-center font-medium text-gray-600 shrink-0">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="font-medium text-gray-900 truncate">{user.name}</div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>
            <div className="shrink-0">
              <StatusBadge status={user.status} />
            </div>
          </button>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Name / Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => setSelected(user)}
                  className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-100 border flex items-center justify-center font-medium text-gray-600">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 inline" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {user.department}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); alert("Demo Mode: Action restricted."); }}
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
        <UserDetailModal user={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}