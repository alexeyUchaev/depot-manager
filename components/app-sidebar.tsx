'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { ArrowLeftRight, BarChart3, Building2, LayoutDashboard, Package, ShoppingCart, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import logo from "@/app/icon.svg"
import { usePathname } from "next/navigation"

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Company", url: "/company", icon: Building2 },
  { title: "Users", url: "/users", icon: Users },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Movements", url: "/movements", icon: ArrowLeftRight },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 pt-6 pb-4 text-lg font-bold tracking-tight text-gray-900">
            <div className="text-sm font-black flex items-center justify-center border border-[#e2e2e2] bg-[#ffffff] rounded-[3px] p-1">
                <div className="relative flex justify-center items-center w-[18px] h-[18px] pl-7">
                    <Image
                        src={logo}
                        alt="logo" 
                        fill={true}           
                    />
                </div>
                <div className="flex justify-center items-center pr-2 mt-0.5">
                    DepotAI
                </div>               
            </div>       
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2 pt-10">
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const active = pathname?.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-400 uppercase tracking-wider">v1.0</div>
      </SidebarFooter>
    </Sidebar>
  )
}