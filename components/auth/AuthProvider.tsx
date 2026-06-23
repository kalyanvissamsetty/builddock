"use client";

import { createContext, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/components/lib/api";
import type { Me } from "@/types";

type AuthContextType = {
  me: Me | null;
  loading: boolean;
  setMe: (me: Me | null) => void;
  refreshMe: () => Promise<Me | null>;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const inFlightRef = useRef<Promise<Me | null> | null>(null);

  async function refreshMe(): Promise<Me | null> {
    if (inFlightRef.current) return inFlightRef.current;

    inFlightRef.current = (async () => {
      try {
        const user = await apiFetch<Me>("/api/auth/me", { method: "GET" });
        setMe(user);
        return user;
      } catch {
        setMe(null);
        try {
          localStorage.removeItem("bd_has_session");
        } catch { }
        return null;
      } finally {
        inFlightRef.current = null;
      }
    })();

    return inFlightRef.current;
  }

  async function logout() {
    setIsLoggingOut(true);

    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setMe(null);
      try {
        localStorage.removeItem("bd_has_session");
      } catch { } finally {
        setIsLoggingOut(false);
      }
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);

      // Only attempt /me if we have a hint (reduces noise on login page)
      let hasHint = false;
      try {
        hasHint = localStorage.getItem("bd_has_session") === "1";
      } catch { }

      if (!hasHint) {
        if (mounted) {
          setMe(null);
          setLoading(false);
        }
        return;
      }

      await refreshMe();
      if (mounted) setLoading(false);
    })();

    // Optional: refresh when tab is focused (no loading flip)
    function onFocus() {
      refreshMe().catch(() => { });
    }
    window.addEventListener("focus", onFocus);

    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ me, loading, setMe, refreshMe, logout,isLoggingOut }),
    [me, loading, isLoggingOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
