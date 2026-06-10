"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";
import { getEntryRouteForUser } from "@/components/auth/defaultRoute";

export default function Page() {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!me) {
      router.replace("/otplogin");
      return;
    }

    router.replace(getEntryRouteForUser(me));
  }, [loading, me, router]);

  return null;
}
