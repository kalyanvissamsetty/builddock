import "../globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <div>
      <AuthProvider>
        <div>{children}</div>
      </AuthProvider>
    </div>
  );
}
