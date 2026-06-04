import logo from "@/app/icon.svg"
import Image from "next/image";

export default function Header() {
    return(
        <header className="fixed flex justify-between items-center md:hidden px-2 py-2 border-b border-[#c3cfd3] top-0 bg-[#202020] w-full p-2">
            <div className="text-sm font-black flex items-center justify-center border border-[#383838] bg-[#e9e9e9] rounded-[3px] p-1">
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
            <button className="flex flex-col justify-around bg-[#e9e9e9] px-1 h-6 rounded-xs py-[3px]">
                <span className="w-5 h-[2px] bg-[#202020]"></span>
                <span className="w-5 h-[2px] bg-[#202020]"></span>
                <span className="w-5 h-[2px] bg-[#202020]"></span>
            </button>
            
        </header>
    )
} 