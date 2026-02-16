import "../globals.css";
import { getMe, Me } from "@/components/lib/auth";
import { redirect } from "next/navigation";



export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let me: Me | undefined;
  try {
    me = await getMe();
  } catch {
    // User is not logged in, which is fine for public pages
  }

  if (me) redirect("/");

  return (
    <div>
      {children}
    </div>
  );
}
