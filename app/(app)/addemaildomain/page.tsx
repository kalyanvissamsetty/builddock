import { RequireRoleClient } from "@/components/auth/RequireRoleClient";
import ManageEmailDomainsPage from "@/components/Pages/Admin/ManageEmailDomainsPage";

export default function AddEmailDomainPage() {
    return (
        <RequireRoleClient allow={["ADMIN"]}>
            <ManageEmailDomainsPage />
        </RequireRoleClient>
    );
}