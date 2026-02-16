import { redirect } from "next/navigation";
import { Me } from "../lib/auth";

type Props = {
  me: Me;
};

export function RoleGate({ me }: Props) {
  if (!me?.role) return null;
  switch (me.role) {
    case "ADMIN":
      return redirect("/vieweraccess")
    case "DEV":
      return redirect("/uploadbuild");
    case "QA":
      return redirect("/viewbuilds");
    case "VIEWER":
      return redirect("/viewbuilds");
    default:
      return null;
  }
}
