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
  let me;
  try {
    me = await getMe();
  } catch (e) {
    console.log("no user found " + e);
  }
  console.log("admin layout");
  if(me == null) redirect("/login")
  return (
    <div>
      <AuthProvider>
        {(me as Me) && <Navbar me={me as Me} />}
        <div className="p-6">{children}</div>
      </AuthProvider>
    </div>
  );
}
