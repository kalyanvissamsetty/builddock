"use client";

import { RouteGuard } from "@/components/auth/RouteGuard";
import { useAuth } from "@/components/auth/useAuth";
import { Navbar } from "@/components/navbar/Navbar";
import { AppSidebar } from "@/components/AppSidebar";
import { notFound, usePathname } from "next/navigation";
import { canAccessPath } from "@/components/auth/access";
export default function AuthRoutesLayout({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const pathname = usePathname();
  const canAccess = canAccessPath(me?.role ?? "VIEWER", pathname);
  if(!canAccess) return notFound( )
  // Prevent UI flashing wrong nav
  if (loading) return null;
  return (
    <RouteGuard>
      {/* RouteGuard will ensure me exists, but keep safe */}
      {!me ? null : me.role === "VIEWER" ? (
        <div>
          <Navbar me={me} />
          {children}
        </div>
      ) : (
        <div className="h-screen overflow-hidden">
          <div className="grid h-full grid-cols-1 md:grid-cols-[20%_80%]">
            <aside className="border-r">
              <AppSidebar me={me} />
            </aside>

            <main className="flex overflow-y-auto p-6">
              <div className="m-auto w-full max-w-4xl">{children}</div>
            </main>
          </div>
        </div>
      )}
    </RouteGuard>
  );
}