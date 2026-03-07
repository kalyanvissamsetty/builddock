import { redirect } from "next/navigation";
import { RoleGate } from "@/components/auth/RoleGate";
import { useAuth } from "@/components/auth/useAuth";

export default function HomePage() {
  const { me } = useAuth();  

  if (!me || typeof me !== "object") {
    redirect("/login");
  }

  return <RoleGate me={me} />;
}
