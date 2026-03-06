import { getMe, Me } from "@/components/lib/auth";
import { Navbar } from "@/components/navbar/Navbar";
import { redirect } from "next/navigation";



export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let me: Me | null = null;
    try {
        me = await getMe();
    } catch (e) {
    }
    if (!me || typeof me !== "object" || !("role" in me)) {
        redirect("/login");
    }
    return (
        <div>
            <Navbar me={me} />
            {children}
        </div>
    );
}
