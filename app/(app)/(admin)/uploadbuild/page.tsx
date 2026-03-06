import { UploadBuild } from "@/components/Pages/Shared/UploadBuild";
import { getMe, Me } from "@/components/lib/auth";
import { notFound, redirect } from "next/navigation";
export const dynamic = "force-dynamic";
async function Page() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!["ADMIN", "DEV"].includes((me as Me).role)) {
    notFound();
  }
  return (
    <div>
      <UploadBuild />
    </div>
  );
}

export default Page;
