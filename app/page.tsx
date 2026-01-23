import Navbar from "@/components/layout/navbar"
import { UploadForm } from "@/components/upload/upload-form"

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16">
      <Navbar />
      <UploadForm />
    </div>
  )
}
