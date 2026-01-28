import Navbar from "@/components/layout/navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-16">
      <Navbar />
      {children}
    </div>
  );
}
