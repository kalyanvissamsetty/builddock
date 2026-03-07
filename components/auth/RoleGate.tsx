import { Me } from "@/types";
import { redirect } from "next/navigation";

type Props = {
  me: Me;
};

export function RoleGate({ me }: Props) {
  if (!me?.role) return null;
  switch (me.role) {
    case "ADMIN":
      return redirect("/vieweraccess")
    case "MANAGER":
      return redirect("/vieweraccess")
    case "DEV":
      return redirect("/uploadbuild");
    case "QA":
      return redirect("/uploadbuild");
    case "VIEWER":
      return redirect("/viewbuilds");
    default:
      return null;
  }
}
