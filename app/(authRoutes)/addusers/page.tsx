import InviteUsersPage from "@/components/Pages/Admin/InviteUsersPage";
import { Suspense } from "react";

export default function AddUsersPage() {
    return (
        <Suspense fallback={null}>
            <InviteUsersPage />
        </Suspense>
    );
}
