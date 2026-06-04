import { ArrowLeftRight, BarChart3, LayoutDashboard, Package, ShoppingCart } from "lucide-react";
import robot from "@/public/robot.svg"
import Link from "next/link";
import Image from "next/image";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Inventory", url: "/inventory", icon: Package }, 
  { title: "Movements", url: "/movements", icon: ArrowLeftRight }, 
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

export default function Footer() {
    return(
        <footer className="fixed px-3 py-2 border-t border-[#c3cfd3] bottom-0 bg-[#202020] w-full p-2">  
            <div className="flex justify-between text-left max-width-[55%] items-center md:hidden ">
                {items.map((item) => (
                        <div key={item.title}>
                            <Link href={item.url} className="text-white"><item.icon/></Link>          
                        </div>
                ))}   
                <div>   
                    <div className=" bottom-2 right-2 bg-[#202020] rounded-sm text-white  w-10 h-1 p-2"></div>
                        <div className="absolute bottom-2 right-3 bg-[#202020] rounded-sm text-white  w-10 h-10 p-2 ">
                            <Image 
                                src={robot}
                                alt="logo" 
                                fill={true} 
                                className="brightness-0 invert pt-0.5"    
                            />
                        </div>          
                    </div>  
            </div>
        </footer>
    )
} 