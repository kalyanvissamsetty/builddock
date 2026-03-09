"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/components/lib/api";
import type { Me } from "@/types";

type AuthContextType = {
  me: Me | null;
  loading: boolean;
  setMe: (me: Me | null) => void;
  refreshMe: () => Promise<Me | null>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    try {
      const user = await apiFetch<Me>("/api/auth/me", { method: "GET" });
      setMe(user);
      return user;
    } catch {
      setMe(null);
      return null;
    }
  }

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setMe(null);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      try {
        const user = await apiFetch<Me>("/api/auth/me", { method: "GET" });
        if (mounted) setMe(user);
      } catch {
        if (mounted) setMe(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMe();

    // Refresh when user comes back to tab
    function onFocus() {
      refreshMe().catch(() => { });
    }

    window.addEventListener("focus", onFocus);

    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const value = useMemo(
    () => ({ me, loading, setMe, refreshMe, logout }),
    [me, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

