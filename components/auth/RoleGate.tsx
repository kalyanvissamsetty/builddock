"use client"

import { Me } from "@/types";
import { redirect } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";


export function RoleGate() {
  const { me, loading } = useAuth();
  if (loading) return null;

  if (!me?.role) return null;
  switch (me.role) {
    case "ADMIN":
      return redirect("/vieweraccess")
    case "MANAGER":
      return redirect("/vieweraccess")
    case "DEV":
      return redirect("/uploadbuild");
    case "QA":
      return redirect("/uploadbuild");
    case "VIEWER":
      return redirect("/viewbuilds");
    default:
      return null;
  }
}
