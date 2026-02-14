"use client";
import Link from "next/link";
import { Me } from "../lib/auth";
import { NAV_ITEMS } from "./navConfig";
import { Button } from "../ui/button";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import Image from "next/image";
import logo from "@/public/logos/logo.png";
type Props = {
  me: Me;
};

export function Navbar({ me }: Props) {
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(me.role));
  const pathname = usePathname();
    async function handleLogout() {
        await apiFetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
    }
    const router = useRouter();
  return (
    <header className="w-full border-b">
      <div className="flex items-center justify-between border-b px-6 py-4">
        {/* Left */}
        <div className="flex items-center gap-10">
          <Link href="/" className="text-lg font-semibold">
            <Image
              src={logo}
              alt="BuildDock Logo"
              width={90}
              height={10}
              priority
            />
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-8 text-md">
          {visibleItems.map(
            (item) =>
              pathname !== item.href && (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              ),
          )}
        </div>
        {/* Right */}
        {!me.id && (
          <div className="flex items-center gap-3">
            <Button variant="ghost">Login</Button>
            <Button>Get Started</Button>
          </div>
        )}
        {me.id && (
          <div className="flex items-center gap-3">
            <Button onClick={handleLogout} variant="outline">
              Log Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
