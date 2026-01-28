import { DashBoard } from "@/components/dashboard/dashboard"
import Navbar from "@/components/layout/navbar"
export default function HomePage() {
  return (
    <div className="flex flex-col gap-16">
      <Navbar/>
      <DashBoard />
    </div>
  )
}
