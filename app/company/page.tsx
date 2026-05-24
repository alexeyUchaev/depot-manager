"use client"

import React from 'react';
import { 
  Building2, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Globe,
  ShieldCheck
} from "lucide-react";

export default function CompanyPage() {
  const companyData = {
    name: "TechMart Wholesale Inc.",
    status: "Active",
    createdAt: "January 8, 2024",
    taxId: "EIN-98-7654321",
    website: "www.techmartwholesale.com",
    phone: "+1 (212) 555-0142",
    email: "operations@techmartwholesale.com",
    address: "450 West 33rd St, New York, NY 10001",
    plan: {
      name: "Pro",
      price: "$149/mo",
      billingCycle: "Monthly",
      nextPayment: "June 8, 2026",
      features: [
        "Unlimited Products",
        "Up to 10 Users",
        "AI Analytics",
        "Priority Support",
      ]
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 text-[#1a1a1a]">
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your organization details and subscription plan.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
          {companyData.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6 border-b pb-3">
              <Building2 className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold">General Information</h2>
            </div>
            
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Company Legal Name
                </label>
                <input 
                  type="text" 
                  defaultValue={companyData.name}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Tax ID / EIN
                  </label>
                  <input 
                    type="text" 
                    defaultValue={companyData.taxId}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Website
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Globe className="h-4 w-4"/>
                    </span>
                    <input 
                      type="text" 
                      defaultValue={companyData.website}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Phone className="h-4 w-4"/>
                    </span>
                    <input 
                      type="text" 
                      defaultValue={companyData.phone}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Mail className="h-4 w-4"/>
                    </span>
                    <input 
                      type="email" 
                      defaultValue={companyData.email}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  HQ Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <MapPin className="h-4 w-4"/>
                  </span>
                  <input 
                    type="text" 
                    defaultValue={companyData.address}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="button" 
                  onClick={() => alert("Demo Mode: Changes cannot be saved.")}
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 border-b pb-3">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold">Subscription</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">
                  Current Plan
                </span>
                <span className="text-xl font-bold block mt-0.5">{companyData.plan.name}</span>
              </div>
              
              <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">
                    Pricing
                  </span>
                  <span className="text-lg font-semibold text-gray-700 mt-0.5">
                    {companyData.plan.price}
                  </span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mb-1">
                  {companyData.plan.billingCycle}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {companyData.plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                <span>Next invoice date:</span>
                <span className="font-medium text-gray-700">{companyData.plan.nextPayment}</span>
              </div>

              <button
                onClick={() => alert("Demo Mode: Upgrade restricted.")}
                className="w-full py-2 border border-black text-black rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Upgrade Plan
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 border-b pb-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold">System Details</h2>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 uppercase tracking-wider">Created At</span>
                <span className="font-medium text-gray-700">{companyData.createdAt}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 uppercase tracking-wider">Organization ID</span>
                <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-gray-600">org_tm450x12</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400 uppercase tracking-wider">Region</span>
                <span className="font-medium text-gray-700">US-East (N. Virginia)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}