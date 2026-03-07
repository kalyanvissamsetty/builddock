import { RequireRoleClient } from "@/components/auth/RequireRoleClient";
import UpdateVersion from "@/components/Pages/Shared/UpdateVersion";

async function Page() {

  return (
      <RequireRoleClient allow={["ADMIN"]}>
        <UpdateVersion />
      </RequireRoleClient>
  );
}

export default Page;
