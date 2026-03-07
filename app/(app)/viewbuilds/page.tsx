import ViewerHome from "@/components/Pages/Viewer/ViewerHome";
import { RequireRoleClient } from "@/components/auth/RequireRoleClient";
async function Page() {
  return (
    <RequireRoleClient allow={["VIEWER"]}>
      <ViewerHome />
    </RequireRoleClient>
  );
}

export default Page;
