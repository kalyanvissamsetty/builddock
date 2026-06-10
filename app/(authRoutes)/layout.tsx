"use client";

import { RouteGuard } from "@/components/auth/RouteGuard";
import { useAuth } from "@/components/auth/useAuth";
import { Navbar } from "@/components/navbar/Navbar";
import { AppSidebar } from "@/components/AppSidebar";
import { getDomainRole, useSelectedDomain } from "@/components/auth/domain";

export default function AuthRoutesLayout({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const { selectedDomain } = useSelectedDomain(me);
  const activeRole = me ? getDomainRole(me, selectedDomain) : null;
  const shouldUseCompactNavbar =
    (selectedDomain === "WEBGL" && activeRole === "VIEWER") ||
    (selectedDomain === "GRAPHICS" && (activeRole === "REVIEWER" || activeRole === "DESIGNER"));

  // Prevent UI flashing wrong nav
  if (loading) return null;
  return (
    <RouteGuard>
      {/* RouteGuard will ensure me exists, but keep safe */}
      {!me ? null : shouldUseCompactNavbar ? (
        <div className="min-h-screen">
          <Navbar me={me} />
          <main className="p-6">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      ) : (
        <div className="h-screen overflow-hidden">
          <div className="grid h-full grid-cols-1 md:grid-cols-[20%_80%]">
            <aside className="border-r">
              <AppSidebar me={me} />
            </aside>

            <div className="flex min-h-0 flex-col">
              
              <main className="flex min-h-0 flex-1 overflow-y-auto p-6">
                <div className="mx-auto w-full max-w-6xl">{children}</div>
              </main>
            </div>
          </div>
        </div>
      )}
    </RouteGuard>
  );
}
