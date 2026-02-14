import { redirect } from "next/navigation";
import { getMe, Me } from "@/components/lib/auth";
import { RoleGate } from "@/components/auth/RoleGate";

import AdminHome from "@/components/dashboard/AdminHome";
import DevHome from "@/components/dashboard/DevHome";
import QAHome from "@/components/dashboard/QAHome";
import ViewerHome from "@/components/Pages/Viewer/ViewerHome";

export default async function HomePage() {
  let me;

  try {
    me = await getMe();
    console.log("main page try");
  } catch {
    console.log("main page catch");
    redirect("/login");
  }

  return <RoleGate me={me as Me} />;
}
