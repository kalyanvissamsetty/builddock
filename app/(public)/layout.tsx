"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";
import { getEntryRouteForUser } from "@/components/auth/defaultRoute";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const PUBLIC_PAGES = ["/login", "/signup", "/verifyotp", "/otplogin", "/logout"];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { me, loading, isLoggingOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isVerifyOtpInvite =
    pathname === "/verifyotp" &&
    new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("reason") === "invite";
  useEffect(() => {
    if (loading) return;
    if (isLoggingOut) return;
    
    if (!me) return;

    if (isVerifyOtpInvite) return;
    if (pathname === "/logout") return;

    if (PUBLIC_PAGES.includes(pathname)) {
      router.replace(getEntryRouteForUser(me));
    }
  }, [loading, isLoggingOut, me, pathname, router, isVerifyOtpInvite]);

  if (loading) {
    return (
      <LoadingScreen
        title="Checking session"
        description="Please wait..."
        fullScreen
      />
    );
  }

  if (isLoggingOut) {
    return (
      <LoadingScreen
        title="Logging out"
        description="Please wait..."
        fullScreen
      />
    );
  }

  // If logged in and on a public page, don't render it (redirecting)
  if (
    me &&
    PUBLIC_PAGES.includes(pathname) &&
    pathname !== "/logout" &&
    !isVerifyOtpInvite
  ) {
    return null;
  }

  return <>{children}</>;
}
