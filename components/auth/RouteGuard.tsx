"use client";

import { useEffect, useRef } from "react";
import { notFound, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";
import { LoadingScreen } from "../ui/LoadingScreen";
import { canAccessPath } from "./access";

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const { me, loading } = useAuth();
    const router = useRouter();
    const redirectedRef = useRef(false);
    const pathname = usePathname();
    useEffect(() => {
        if (loading) return;
        if (redirectedRef.current) return;

        if (!me) {
            redirectedRef.current = true;
            router.replace("/login");
        }
    }, [loading, me, router]);

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

    if (canAccessPath(me.role, pathname)) {
        return <>{children}</>;
    }
    return notFound();
}