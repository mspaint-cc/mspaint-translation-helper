import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TranslationProvider } from "@/components/translation-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner"

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "[mspaint] Translation Helper",
  description: "A website that helps translate mspaint.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className}`}
      >
        <Toaster />
        <TranslationProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className="px-5 py-5 w-full">
                <div className="flex flex-row items-center gap-2">
                  <SidebarTrigger />
                  <h1>Translation Helper</h1>
                </div>
                <div className="py-5 w-full">
                  {children}
                </div>
            </main>
          </SidebarProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
