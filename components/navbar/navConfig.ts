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
    roles: ["ADMIN", "MANAGER"],
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
    roles: ["ADMIN","MANAGER" ,"DEV"],
    href: "/users",
    children: [
      {
        label: "Add Email Domain",
        href: "/addemaildomain",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        label: "Add Users",
        href: "/addusers",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        label: "Promote Users",
        href: "/promoteusers",
        roles: ["ADMIN", "MANAGER"],
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
