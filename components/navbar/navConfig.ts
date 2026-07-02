
import type { ReviewDomain } from "@/types";

export type NavItem = {
  label: string;
  href: string;
  domain?: ReviewDomain | "ALL";
  children?: NavItem[]
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "View All Builds",
    href: "/allbuilds",
    domain: "WEBGL",
  },
  {
    label: "Assign Build Access",
    href: "/vieweraccess",
    domain: "WEBGL",
  },
  
  {
    label: "User Management",
    href: "/users",
    domain: "WEBGL",
    children: [
      {
        label: "Add Email Domain",
        href: "/addemaildomain",
        domain: "WEBGL",
      },
      {
        label: "Add Users",
        href: "/addusers",
        domain: "WEBGL",
      },
      {
        label: "User Role Management",
        href: "/promoteusers",
        domain: "WEBGL",
      }
    ],
  },
  {
    label: "Projects",
    href: "/manageprojects",
    domain: "WEBGL",
  },
  {
    label: "Environments",
    href: "/manageenvironments",
    domain: "WEBGL",
  },
  {
    label: "Builds",
    href: "/builds",
    domain: "WEBGL",
    children: [
      {
        label: "Upload Build",
        href: "/uploadbuild",
        domain: "WEBGL",
      },
      {
        label: "Delete Build",
        href: "/deletebuild",
        domain: "WEBGL",
      },
    ],
  },
  {
    label: "Graphics Projects",
    href: "/graphicprojects",
    domain: "GRAPHICS",
  },
  {
    label: "Assign Tickets",
    href: "/assigntickets",
    domain: "GRAPHICS",
  },
  {
    label: "Add Email Domain",
    href: "/addemaildomain",
    domain: "GRAPHICS",
  },
  {
    label: "Add Users",
    href: "/addusers",
    domain: "GRAPHICS",
  },
  {
    label: "User Role Management",
    href: "/promoteusers",
    domain: "GRAPHICS",
  },
  {
    label: "Create Ticket",
    href: "/createticket",
    domain: "GRAPHICS",
  },
  {
    label: "View Tickets",
    href: "/viewtickets",
    domain: "GRAPHICS",
  },
];
