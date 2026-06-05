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
import Link from "next/link"

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
  return (
    <Sidebar>      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel  className="py-10 text-xl font-black text-black" >Depot-Manager</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem className="p-2" key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="text-black">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
      </SidebarFooter>
    </Sidebar>
  )
}