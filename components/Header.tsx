'use client'

import logo from "@/app/icon.svg"
import Image from "next/image";
import { useSidebar } from "./ui/sidebar";


export default function Header() {
    const { toggleSidebar } = useSidebar();

    return(
        <header className="fixed z-40 flex justify-between items-center md:hidden px-2 py-2 border-b border-[#c3cfd3] top-0 bg-background w-full p-2">            
            <button
                type="button"
                aria-label="Toggle navigation menu"
                onClick={toggleSidebar}
                className="flex flex-col justify-around  px-1 h-6 rounded-xs py-[3px]"
            >
                <span className="w-5 h-[2px] bg-foreground"></span>
                <span className="w-5 h-[2px] bg-foreground"></span>
                <span className="w-5 h-[2px] bg-foreground"></span>
            </button> 
            <div className="inline-flex items-end gap-2 rounded-[4px] border border-neutral-600 bg-[#111111] px-3 py-1.5 text-sm font-black text-white">
                <Image
                src={logo}
                alt="DepotAI logo"
                width={18}
                height={18}
                className="brightness invert shrink-0 object-contain object-bottom"
                />
                <span className="leading-none">DepotAI</span>
            </div>       
        </header>
    )
} 