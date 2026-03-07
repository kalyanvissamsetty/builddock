import { RequireRoleClient } from "@/components/auth/RequireRoleClient";
import DeleteBuild from "@/components/Pages/Shared/DeleteBuild";


export default async function Page() {
  return (
    <RequireRoleClient allow={["ADMIN"]}>
      <DeleteBuild />
    </RequireRoleClient>
  );
}