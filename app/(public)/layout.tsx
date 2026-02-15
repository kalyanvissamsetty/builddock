import "../globals.css";
import { getMe } from "@/components/lib/auth";
import { redirect } from "next/navigation";



export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("public layout")
  // let me
  // try{
  //  me = await getMe()
  // }
  // catch(e){
  //   console.log("no user found "+ e)
  // }
  // if(me) redirect("/")

  return (
    <div>
      {children}
    </div>
  );
}
