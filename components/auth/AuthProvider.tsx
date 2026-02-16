"use client";

import { createContext, useEffect, useState } from "react";
import { apiFetch } from "@/components/lib/api";
import { Me } from "../lib/auth";

type AuthContextType = {
  me: Me | null;
  loading: boolean;
  setMe: (me: Me | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMe() {
      try {
        const user = await apiFetch<Me>("/api/auth/me");
        setMe(user);
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, []);

  return (
    <AuthContext.Provider value={{ me, loading, setMe }}>
      {children}
    </AuthContext.Provider>
  );
}
export { AuthContext };