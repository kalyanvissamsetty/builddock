import "../globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar/Navbar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/components/auth/useAuth";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { me } = useAuth();
  if (!me || typeof me !== "object" || !("role" in me)) {
    redirect("/login");
  }
  if (me.role == "VIEWER") {
    return (
        <div>
          <Navbar me={me} />
          {children}
        </div>
    )
  }
  return (
    <div className="h-screen overflow-hidden">

      {/* Grid layout */}
      <div className="grid h-full grid-cols-1 md:grid-cols-[20%_80%]">
        <AuthProvider>
        <aside className="border-r">
          <AppSidebar me={me} />
        </aside>

        <main className="flex overflow-y-auto p-6">
          <div className="m-auto w-full max-w-4xl">
            {children}
          </div>
        </main>
        </AuthProvider>

      </div>
    </div>
  );
}
