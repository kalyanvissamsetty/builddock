import { getMe } from "@/components/lib/auth";
import { notFound, redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const me = await getMe();
  if(!me) redirect("/login")
  if (typeof me !== "object" || me === null) {
    redirect("/login")
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else if ((me as any).role === "VIEWER") return notFound();

  return (
    <div className="h-screen overflow-hidden">

      {/* Grid layout */}
      <div className="grid h-full grid-cols-1 md:grid-cols-[20%_80%]">

        <aside className="border-r">
          <AppSidebar me={me} />
        </aside>

        <main className="flex overflow-y-auto p-6">
          <div className="m-auto w-full max-w-4xl">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
