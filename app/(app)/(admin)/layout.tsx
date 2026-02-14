import { getMe } from "@/components/lib/auth";
import { notFound, redirect } from "next/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const me = await getMe();

  if (typeof me !== "object" || me === null) {
    redirect("/login")
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else if ((me as any).role !== "ADMIN") return notFound();

  return <>{children}</>
}
