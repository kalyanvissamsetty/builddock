import { getMe, Me } from "@/components/lib/auth";
import DeleteBuild from "@/components/Pages/Shared/DeleteBuild";
import { notFound } from "next/navigation";

async function Page() {
  const me = await getMe();

  if (!["ADMIN", "DEV"].includes((me as Me).role)) {
    notFound();
  }
  return (
    <div>
      <DeleteBuild />
    </div>
  );
}

export default Page;
