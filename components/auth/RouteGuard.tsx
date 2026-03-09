"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";
import { LoadingScreen } from "../ui/LoadingScreen";

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const { me, loading } = useAuth();
    const router = useRouter();
    const redirectedRef = useRef(false);

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

    return <>{children}</>;
}