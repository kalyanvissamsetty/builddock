"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { useAuth } from "@/components/auth/useAuth";
import { Navbar } from "@/components/navbar/Navbar";
import { AppSidebar } from "@/components/AppSidebar";
import { getDomainRole, useSelectedDomain } from "@/components/auth/domain";

const WEBGL_TITLE_PATHS = new Set([
  "/vieweraccess",
  "/uploadbuild",
  "/deletebuild",
  "/updateversions",
  "/manageprojects",
  "/manageenvironments",
  "/mybuilds",
  "/allbuilds",
]);

const GRAPHICS_TITLE_PATHS = new Set([
  "/graphicprojects",
  "/graphicprojectaccess",
  "/assigntickets",
  "/createticket",
  "/viewtickets",
]);

function titleForRoute(pathname: string, selectedDomain: "WEBGL" | "GRAPHICS") {
  if (pathname === "/profileselection") return "Mosaic Review Platform";
  if (pathname.startsWith("/tickets/") || GRAPHICS_TITLE_PATHS.has(pathname)) return "Graphic Reviews";
  if (WEBGL_TITLE_PATHS.has(pathname)) return "WebGL Reviews";
  return selectedDomain === "GRAPHICS" ? "Graphic Reviews" : "WebGL Reviews";
}

export default function AuthRoutesLayout({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const pathname = usePathname();
  const { selectedDomain } = useSelectedDomain(me);
  const activeRole = me ? getDomainRole(me, selectedDomain) : null;
  const shouldUseCompactNavbar =
    (selectedDomain === "WEBGL" && activeRole === "VIEWER") ||
    (selectedDomain === "GRAPHICS" && (activeRole === "REVIEWER" || activeRole === "DESIGNER"));

  useEffect(() => {
    document.title = titleForRoute(pathname, selectedDomain);
  }, [pathname, selectedDomain]);

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
