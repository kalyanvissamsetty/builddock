import { redirect } from "next/navigation";
import { getMe, Me } from "@/components/lib/auth";
import { RoleGate } from "@/components/auth/RoleGate";

export default async function HomePage() {
  let me: Me | null = null;

  try {
    me = await getMe();
  } catch {
    redirect("/login");
  }

  if (!me || typeof me !== "object") {
    redirect("/login");
  }

  return <RoleGate me={me} />;
}
