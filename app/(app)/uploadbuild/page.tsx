import { RequireRoleClient } from "@/components/auth/RequireRoleClient";
import { UploadBuild } from "@/components/Pages/Shared/UploadBuild";

async function Page() {
  return (
      <RequireRoleClient allow={["ADMIN"]}>
        <UploadBuild />
      </RequireRoleClient>
  );
}

export default Page;
