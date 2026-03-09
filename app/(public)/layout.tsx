"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";
import { defaultRouteForRole } from "@/components/auth/defaultRoute";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const PUBLIC_PAGES = ["/login", "/signup", "/verifyotp", "/otplogin", "/logout"];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!me) return;

    // Allow /logout even when logged in
    if (pathname === "/logout") return;

    // If logged in, block public pages and send to default route
    if (PUBLIC_PAGES.includes(pathname)) {
      router.replace(defaultRouteForRole(me.role));
    }
  }, [loading, me, pathname, router]);

  // While checking, avoid flashing login form
  if (loading) {
    return (
      <LoadingScreen
        title="Checking session"
        description="Please wait..."
        fullScreen
      />
    );
  }

  // If logged in and on a public page, don't render it (redirecting)
  if (me && PUBLIC_PAGES.includes(pathname) && pathname !== "/logout") {
    return null;
  }

  return <>{children}</>;
}