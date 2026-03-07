import { RequireRoleClient } from "@/components/auth/RequireRoleClient";
import ManageEnvironementsPage from "@/components/Pages/Admin/ManageEnvironementsPage";

function Page() {
  return (
      <RequireRoleClient allow={["ADMIN"]}>
        <ManageEnvironementsPage />
      </RequireRoleClient>
  );
}

export default Page;
