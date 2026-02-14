import { getMe, Me } from "@/components/lib/auth";
import UpdateVersion from "@/components/Pages/Shared/UpdateVersion";
import { notFound } from "next/navigation";

async function Page() {
  const me = await getMe();

  if (!["ADMIN", "DEV"].includes((me as Me).role)) {
    notFound();
  }
  return (
    <div>
      <UpdateVersion />
    </div>
  );
}

export default Page;
