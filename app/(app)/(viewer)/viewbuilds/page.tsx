import ViewerHome from "@/components/Pages/Viewer/ViewerHome";
import { getMe, Me } from "@/components/lib/auth";
import { notFound } from "next/navigation";

async function Page() {
  const me = await getMe();

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
