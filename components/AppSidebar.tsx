"use client";

import {  useState } from "react";
import { ChevronRight, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import logo from "@/public/logos/logo.png";
import { NAV_ITEMS } from "./navbar/navConfig";
import { Button } from "./ui/button";
import { Me } from "@/types";
import { canAccessPath } from "./auth/access";
import { useAuth } from "./auth/useAuth";
type Props = {
    me: Me;
};

export function AppSidebar({ me }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const {logout} = useAuth()
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const visibleItems = NAV_ITEMS.filter((item) => {
        if (!item.href) return true;
        return canAccessPath(me.role, item.href);
    });

    async function handleLogout() {
        try {
            logout();
            console.log("Logout successful");
        } finally {
            console.log("Logout in finally block")
            router.replace("/login");
        }
    }
    
    return (
        <aside className="h-full bg-background flex flex-col border-r">
            {/* Logo */}
            <div className="px-4 py-2 border-b">
                <Link href="/" className="inline-flex items-center">
                    <Image
                        src={logo}
                        alt="Logo"
                        width={120}
                        height={32}
                        priority
                        className="my-2"
                    />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                {visibleItems.map((item) => {
                    // ---------- DROPDOWN ITEM ----------
                    if (item.children) {
                        // Filter children by role
                        const visibleChildren = item.children.filter((child) => {
                            if (!child.href) return true;
                            return canAccessPath(me.role, child.href);
                        });

                        // If no children are visible, hide the entire parent
                        if (visibleChildren.length === 0) {
                            return null;
                        }

                        const isOpen = openMenu === item.label;
                        const isChildActive = visibleChildren.some(
                            (child) => child.href === pathname
                        );

                        return (
                            <div key={item.label}>
                                {/* Parent */}
                                <button
                                    onClick={() =>
                                        setOpenMenu(isOpen ? null : item.label)
                                    }
                                    className={[
                                        "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
                                        isChildActive
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    ].join(" ")}
                                >
                                    <span>{item.label}</span>
                                    <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                                </button>

                                {/* Children */}
                                {isOpen && (
                                    <div className="mt-1 ml-4 space-y-1">
                                        {visibleChildren.map((child) => {
                                            const isActive = pathname === child.href;

                                            return (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    className={[
                                                        "block rounded-md px-3 py-2 text-sm",
                                                        isActive
                                                            ? "bg-muted text-foreground"
                                                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                                    ].join(" ")}
                                                >
                                                    {child.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // ---------- NORMAL LINK ----------
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={[
                                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            ].join(" ")}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t space-y-3">
                <Button variant="outline" className="w-full" onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                </Button>
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                    Log Out
                </Button>
            </div>
        </aside>
    );
}