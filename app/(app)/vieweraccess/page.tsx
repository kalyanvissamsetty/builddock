import { RequireRoleClient } from "@/components/auth/RequireRoleClient";
import { ViewerAccessPage } from "@/components/Pages/Admin/ViewerAccessPage";

function Page() {
  return (
    <RequireRoleClient allow={["ADMIN"]}>
      <ViewerAccessPage />
    </RequireRoleClient>
  );
}

export default Page;
