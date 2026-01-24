import Navbar from "../components/navbar";
import BuildDashboard from "@/components/dashboard/build-dashboard";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <BuildDashboard />
      </main>
    </div>
  );
}
