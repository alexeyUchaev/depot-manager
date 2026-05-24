"use client";

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  Mail, 
  MoreVertical, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";

export default function UsersPage() {
  const [users] = useState([
    { 
      id: 1, 
      name: "Alexey U.", 
      email: "alexey@techmartwholesale.com", 
      role: "Owner", 
      status: "Active", 
      department: "Management" 
    },
    { 
      id: 2, 
      name: "John Doe", 
      email: "j.doe@techmartwholesale.com", 
      role: "Manager", 
      status: "Active", 
      department: "Warehouse Operations" 
    },
    { 
      id: 3, 
      name: "Mike Smith", 
      email: "m.smith@techmartwholesale.com", 
      role: "Manager", 
      status: "Active", 
      department: "Inventory Control" 
    },
    { 
      id: 4, 
      name: "Anna Kovalsky", 
      email: "a.kovalsky@techmartwholesale.com", 
      role: "Staff", 
      status: "Active", 
      department: "Sales & Orders" 
    },
    { 
      id: 5, 
      name: "Kevin Jones", 
      email: "k.jones@techmartwholesale.com", 
      role: "Staff", 
      status: "Inactive", 
      department: "Warehouse Operations" 
    },
  ]);

  const getRoleBadge = (role: string) => {
    switch(role) {
      case "Owner":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "Manager":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 text-[#1a1a1a]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage user permissions, roles, and department assignments for your staff.
          </p>
        </div>
        <button 
          onClick={() => alert("Demo Mode: Cannot invite users in the preview version.")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap self-start sm:self-center"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input 
            type="text" 
            placeholder="Search by name, email or role..." 
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-medium">
          Total Members: <span className="text-sm font-bold text-black bg-gray-100 px-2 py-0.5 rounded ml-1">{users.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
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
                <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">

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
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                      <Shield className="h-3 w-3" />
                      {user.role}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {user.department}
                  </td>
                  
                  <td className="px-6 py-4">
                    {user.status === "Active" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => alert("Demo Mode: Action restricted.")}
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

    </div>
  );
}