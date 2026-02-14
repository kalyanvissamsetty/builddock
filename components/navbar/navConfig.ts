import { Role } from "../lib/auth";

export type NavItem = {
  label: string;
  href: string;
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Assign Build Access",
    href: "/vieweraccess",
    roles: ["ADMIN"],
  },
  {
    label: "Upload Build",
    href: "/uploadbuild",
    roles: ["ADMIN", "DEV"],
  },
  {
    label: "Update Versions",
    href: "/updateversions",
    roles: ["ADMIN", "DEV"],
  },
  {
    label: "Promote Users",
    href: "/promoteusers",
    roles: ["ADMIN"],
  }
];
