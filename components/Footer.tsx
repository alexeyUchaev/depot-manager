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
            {/* <footer className="fixed md:hidden px-3 py-2 z-40 border-t border-[#c3cfd3] bottom-0 bg-[#202020] w-full p-2">  
                <div className="flex justify-between text-left max-width-[55%] items-center  ">
                    {items.map((item) => (
                        <div key={item.title}>
                            <Link href={item.url} className="text-white"><item.icon/></Link>          
                        </div>
                    ))}   
                    <div>   
                        <div className=" bottom-2 right-2 bg-[#202020] rounded-sm text-white  w-10 h-1 p-2"></div>
                        <button onClick={() => setIsopen(prev => !prev)} className="absolute bottom-2 right-3 bg-[#202020] rounded-sm text-white  w-10 h-10 p-2 ">
                            <Image 
                                src={robot}
                                alt="logo" 
                                fill={true} 
                                className="brightness-0 invert pt-0.5"    
                            />
                        </button>          
                    </div>  
                </div>
            </footer> */}
            <footer className="fixed md:hidden px-3 py-2 z-40 border-t border-[#c3cfd3] bottom-0 bg-[#ffffff] w-full p-2">  
                <div className="flex justify-between text-left max-width-[55%] items-center  ">
                    {items.map((item) => (
                        <div key={item.title}>
                            <Link href={item.url} className="text-black"><item.icon/></Link>          
                        </div>
                    ))}   
                    <div>   
                        <div className=" bottom-2 right-2 bg-[#ffffff] rounded-sm text-white  w-10 h-1 p-2"></div>
                        <button onClick={() => setIsopen(prev => !prev)} className="absolute bottom-2 right-3 bg-[#ffffff] rounded-sm text-white  w-10 h-10 p-2 ">
                            <Image 
                                src={robot}
                                alt="logo" 
                                fill={true} 
                                className=""    
                            />
                        </button>          
                    </div>  
                </div>
            </footer>
        </>
    )
} 