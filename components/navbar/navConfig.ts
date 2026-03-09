
export type NavItem = {
  label: string;
  href: string;
  children? : NavItem[]
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "View All Builds",
    href: "/allbuilds",
  },
  {
    label: "Assign Build Access",
    href: "/vieweraccess",
  },
  {
    label: "Builds",
    href: "/builds",
    children: [
      {
        label: "Upload Build",
        href: "/uploadbuild",
      },
      {
        label: "Delete Build",
        href: "/deletebuild",
      },
    ],
  },
  {
    label: "Users",
    href: "/users",
    children: [
      {
        label: "Add Email Domain",
        href: "/addemaildomain",
      },
      {
        label: "Add Users",
        href: "/addusers",
      },
      {
        label: "Promote Users",
        href: "/promoteusers",
      }
    ],
  },
  // {
  //   label: "Update Versions",
  //   href: "/updateversions",
  // },
  {
    label: "Projects",
    href: "/manageprojects",
  },
  {
    label: "Environments",
    href: "/manageenvironments",
  }
];
