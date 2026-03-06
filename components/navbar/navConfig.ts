import { Role } from "../lib/auth";

export type NavItem = {
  label: string;
  href: string;
  roles: Role[];
  children? : NavItem[]
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Assign Build Access",
    href: "/vieweraccess",
    roles: ["ADMIN"],
  },
  {
    label: "Builds",
    roles: ["ADMIN", "DEV"],
    href: "/builds",
    children: [
      {
        label: "Upload Build",
        href: "/uploadbuild",
        roles: ["ADMIN"],
      },
      {
        label: "Delete Build",
        href: "/deletebuild",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "Users",
    roles: ["ADMIN", "DEV"],
    href: "/users",
    children: [
      {
        label: "Add Email Domain",
        href: "/addemaildomain",
        roles: ["ADMIN"],
      },
      {
        label: "Add Users",
        href: "/addusers",
        roles: ["ADMIN"],
      },
      {
        label: "Promote Users",
        href: "/promoteusers",
        roles: ["ADMIN"],
      }
    ],
  },
  {
    label: "Update Versions",
    href: "/updateversions",
    roles: ["ADMIN", "DEV"],
  },
  {
    label: "Projects",
    href: "/manage-projects",
    roles: ["ADMIN", "DEV"],
  },
  {
    label: "Environments",
    href: "/manage-environments",
    roles: ["ADMIN", "DEV"],
  }
];
