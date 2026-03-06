import "../globals.css";
import { getMe, Me } from "@/components/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // let me: Me | undefined;

  // try {
  //   me = await getMe();
  // } catch {
  //   // not logged in is fine
  // }

  // const h = await headers();
  // const url = h.get("x-next-url") || "";
  // const isInviteVerify =
  //   url.includes("/verifyotp") && url.includes("reason=invite");

  // // If logged in, block public pages except invite verify
  // if (me && !isInviteVerify) {
  //   redirect("/");
  // }

  return <div>{children}</div>;
}