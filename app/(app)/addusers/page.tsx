import { RequireRoleClient } from "@/components/auth/RequireRoleClient";
import InviteUsersPage from "@/components/Pages/Admin/InviteUsersPage";

export default function AddUsersPage() {
    return (
        <RequireRoleClient allow={["ADMIN"]}>
            <InviteUsersPage />
        </RequireRoleClient>
    );
}