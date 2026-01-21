import Navbar from "@/components/custom/navbar";
import UploaderPage from "@/components/custom/uploaderpage";

export default function Home() {
  return (
    <div className="flex flex-col gap-20">
      <Navbar/>
      <UploaderPage/>
    </div>
  );
}
