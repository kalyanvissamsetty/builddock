"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";
import { defaultRouteForRole } from "@/components/auth/defaultRoute";

export default function Page() {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!me) {
      router.replace("/otplogin");
      return;
    }

    router.replace(defaultRouteForRole(me.role));
  }, [loading, me, router]);

  return null;
}