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
  useSidebar,
} from "@/components/ui/sidebar"
import { ThemeToggle  } from "./theme-toggle"
import { ArrowLeftRight, BarChart3, Building2, LayoutDashboard, Package, PackagePlus, ShoppingCart, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import logo from "@/app/icon.svg"
import { usePathname } from "next/navigation"

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },    
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Intake", url: "/intake", icon: PackagePlus },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Movements", url: "/movements", icon: ArrowLeftRight },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Company", url: "/company", icon: Building2 },
  { title: "Users", url: "/users", icon: Users },

];

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar>
      <SidebarContent >
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 pt-6 pb-4 text-lg font-bold tracking-tight text-sidebar-foreground">
            <div className="inline-flex items-end gap-2 rounded-[4px] border border-neutral-600 bg-[#111111] px-3 py-1.5 text-sm font-black text-white">
                <Image
                src={logo}
                alt="DepotAI logo"
                width={18}
                height={18}
                className="hidden md:block brightness invert shrink-0 object-contain object-bottom"
                />
                <span className="hidden md:block leading-none">DepotAI</span>
                <span className="block md:hidden pt-1 leading-none">MENU</span>
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
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      }`}
                    >
                        <Link 
                          href={item.url}
                          onClick={() => setOpenMobile(false)}
                        >
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
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            v1.0
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}