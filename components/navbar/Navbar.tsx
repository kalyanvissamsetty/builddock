"use client";
import Link from "next/link";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Me } from "@/types";
import { useAuth } from "../auth/useAuth";
import { User } from "lucide-react";
import { getLogoFromWindowOrigin } from "../Helpers/TenantRules";
type Props = {
  me: Me;
};

export function Navbar({ me }: Props) {
  const { logout } = useAuth()

  async function handleLogout() {
    try {
      await logout()
    } finally {
      router.replace("/otplogin");
    }
  }
  const router = useRouter();
  return (
    <header className="w-full border-b">
      <div className="flex items-center justify-between border-b px-6 py-1">
        {/* Left */}
        <div className="flex items-center gap-10">
          <Link href="/" className="text-lg font-semibold">
            <Image
              src={getLogoFromWindowOrigin()}
              alt="Logo"
              width={120}
              height={10}

              priority
            />
          </Link>
        </div>

        {me.id && (
          <div className="flex items-center gap-3">
            {/* <Button
              variant="outline"
              onClick={() => router.push("/profile")}
            >
              <User className="mr-2 h-4 w-4" />
              View Profile
            </Button> */}
            <Button onClick={handleLogout} variant="outline">
              Log Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
