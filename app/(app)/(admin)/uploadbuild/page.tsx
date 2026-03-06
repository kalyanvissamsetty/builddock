import { UploadBuild } from "@/components/Pages/Shared/UploadBuild";
import { getMe, Me } from "@/components/lib/auth";
import { notFound } from "next/navigation";

async function Page() {
  const me = await getMe();

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
