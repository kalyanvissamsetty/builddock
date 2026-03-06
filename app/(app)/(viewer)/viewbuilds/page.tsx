import ViewerHome from "@/components/Pages/Viewer/ViewerHome";
import { getMe, Me } from "@/components/lib/auth";
import { notFound, redirect } from "next/navigation";
export const dynamic = "force-dynamic";
async function Page() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!["VIEWER"].includes((me as Me).role)) {
    notFound();
  }
  return (
    <div>
      <ViewerHome />
    </div>
  );
}

export default Page;
