'use client'
import { ArrowLeftRight, BarChart3, LayoutDashboard, Package, ShoppingCart } from "lucide-react";
import robot from "@/public/robot.svg"
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import MobAI from "./cline-agent-mob";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Inventory", url: "/inventory", icon: Package }, 
  { title: "Movements", url: "/movements", icon: ArrowLeftRight }, 
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

export default function Footer() {
    const [isopen, setIsopen] = useState(false)
    return(
        <>
            <MobAI isOpen={isopen}/>
            <footer className="fixed md:hidden px-3 py-2 z-40 border-t border-[#c3cfd3] bottom-0  bg-background w-full p-2">  
                <div className="flex justify-between text-left max-width-[55%] items-center  ">
                    {items.map((item) => (
                        <div key={item.title}>
                            <Link href={item.url} aria-label={item.title} className="text-foreground"><item.icon  aria-hidden="true"/></Link>          
                        </div>
                    ))}   
                    <div>   
                        <div className=" bottom-2 right-2  bg-background rounded-sm text-white  w-10 h-1 p-2"></div>
                        <button onClick={() => setIsopen(prev => !prev)} aria-label="Toggle AI assistant" aria-expanded={isopen} className="absolute bottom-2 right-3  bg-background rounded-sm text-white  w-10 h-10 p-2 ">
                            <Image 
                                src={robot}
                                alt="" 
                                fill={true} 
                                className="dark:invert"    
                            />
                        </button>          
                    </div>  
                </div>
            </footer>
        </>
    )
} 