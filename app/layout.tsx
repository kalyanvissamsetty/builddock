import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { avenir } from "../public/fonts/fonts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WebGL Viewer",
  description: "Unity Webgl Build Management Tool",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <body
        className={`${avenir.variable} antialiased min-h-screen font-sans`}
      >
        <main>
          <TooltipProvider>{children}</TooltipProvider>
        </main>

        <Toaster />
      </body>
    </html>
  );
}
