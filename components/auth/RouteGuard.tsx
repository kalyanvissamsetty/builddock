"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";
import { LoadingScreen } from "../ui/LoadingScreen";
import { canAccessPathForMe } from "./access";
import { getDefaultRouteForDomain, getEntryRouteForUser } from "./defaultRoute";
import { getAllowedDomains, useSelectedDomain } from "./domain";

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const { me, loading } = useAuth();
    const router = useRouter();
    const redirectedRef = useRef(false);
    const pathname = usePathname();
    const { selectedDomain, setSelectedDomain } = useSelectedDomain(me);
    const currentPath = typeof window === "undefined" ? pathname : `${pathname}${window.location.search}`;

    useEffect(() => {
        if (loading) return;

        if (!me) {
            if (redirectedRef.current) return;
            redirectedRef.current = true;
            router.replace("/otplogin");
            return;
        }

        redirectedRef.current = false;

        const allowedDomains = getAllowedDomains(me);
        if (!allowedDomains.includes(selectedDomain)) {
            setSelectedDomain(allowedDomains[0] ?? "WEBGL");
            return;
        }

        if (!canAccessPathForMe(me, currentPath, selectedDomain)) {
            router.replace(pathname === "/profileselection" ? getEntryRouteForUser(me) : getDefaultRouteForDomain(me, selectedDomain));
        }
    }, [currentPath, loading, me, pathname, router, selectedDomain, setSelectedDomain]);

    if (loading) {
        return (
            <LoadingScreen
                title="Checking your session"
                description="Verifying access..."
                fullScreen
            />
        );
    }

    if (!me) {
        return (
            <LoadingScreen
                title="Redirecting"
                description="Taking you to login..."
                fullScreen
            />
        );
    }

    if (!canAccessPathForMe(me, currentPath, selectedDomain)) {
        return (
            <LoadingScreen
                title="Redirecting"
                description="Taking you to your default page..."
                fullScreen
            />
        );
    }

    return <>{children}</>;
}
