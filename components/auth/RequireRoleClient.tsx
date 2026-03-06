"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/components/lib/auth";
import { useAuth } from "./useAuth";

export function RequireRoleClient({
    allow,
    children,
}: {
    allow: Role[];
    children: React.ReactNode;
}) {
    const { me, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!me) {
            router.replace("/login");
            return;
        }
        if (!allow.includes(me.role)) {
            router.replace("/404");
        }
    }, [loading, me, allow, router]);

    if (loading) return null;
    if (!me) return null;
    if (!allow.includes(me.role)) return null;

    return <>{children}</>;
}