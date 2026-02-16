import "../globals.css";
import { Navbar } from "@/components/navbar/Navbar";
import { getMe, Me } from "@/components/lib/auth";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/auth/AuthProvider";



export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let me: Me | null = null;
  try {
    me = await getMe();
  } catch (e) {
  }
  if (!me || typeof me !== "object" || !("role" in me)) {
    redirect("/login");
  }
  return (
    <div>
      <AuthProvider>
        <Navbar me={me as Me} />
        <div className="p-6">{children}</div>
      </AuthProvider>
    </div>
  );
}
