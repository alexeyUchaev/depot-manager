import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ClineAgent } from "@/components/ai-agent/cline-agent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DepotAI | Intelligent Warehouse Management",
  description: "Streamline your auto dismantling business with DepotAI. AI-powered inventory tracking, automated stock management, and intelligent warehouse analytics designed to boost efficiency and profitability.",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col ">
          <SidebarProvider>
            <Header/>
            <AppSidebar />
              <main className="flex-1 min-w-0 p-3 md:p-6">
                <SidebarTrigger />
                {children}
              </main>
            <ClineAgent />
            <Footer/>
          </SidebarProvider>  
        </body>
      </html>
  );
}
