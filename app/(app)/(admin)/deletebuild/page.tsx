import { getMe } from "@/components/lib/auth";
import DeleteBuild from "@/components/Pages/Shared/DeleteBuild";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Page() {
  const me = await getMe();

  if (!me) redirect("/login");

  if (!["ADMIN", "DEV"].includes(me.role)) {
    notFound();
  }

  return (
    <div>
      <DeleteBuild />
    </div>
  );
}