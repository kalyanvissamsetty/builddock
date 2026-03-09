import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { avenir } from "../public/fonts/fonts";
import { AuthProvider } from "@/components/auth/AuthProvider";


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
      <body className={`${avenir.variable} antialiased min-h-screen font-sans`}>
        <AuthProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
