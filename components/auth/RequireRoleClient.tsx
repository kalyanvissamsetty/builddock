"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { Role } from "@/types";

export function RequireRoleClient({
    allow,
    children,
}: {
    allow: Role[];
    children: React.ReactNode;
}) {
    const { me, loading } = useAuth();
    const router = useRouter();

    const allowKey = useMemo(() => allow.join(","), [allow]);
    const redirectedRef = useRef(false);

    useEffect(() => {
        if (loading) return;
        if (redirectedRef.current) return;

        if (!me) {
            redirectedRef.current = true;
            router.replace("/login");
            return;
        }

        if (!allow.includes(me.role)) {
            redirectedRef.current = true;
            router.replace("/404");
        }
    }, [loading, me, allowKey, router]);

    if (loading) return null;
    if (!me) return null;
    if (!allow.includes(me.role)) return null;

    return <>{children}</>;
}