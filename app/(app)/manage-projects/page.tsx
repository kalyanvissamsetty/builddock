import { RequireRoleClient } from "@/components/auth/RequireRoleClient";
import ManageProjectsPage from "@/components/Pages/Admin/ManageProjectsPage";

function Page() {
  return (
      <RequireRoleClient allow={["ADMIN"]}>
        <ManageProjectsPage />
      </RequireRoleClient>
  );
}

export default Page;
