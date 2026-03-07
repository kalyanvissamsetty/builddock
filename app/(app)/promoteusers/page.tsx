import { RequireRoleClient } from "@/components/auth/RequireRoleClient";
import PromoteUsersPage from "@/components/Pages/Admin/PromoteUsers";

function Page() {
  return (
      <RequireRoleClient allow={["ADMIN"]}>
        <PromoteUsersPage />
      </RequireRoleClient>
  );
}

export default Page;
