import { AccessRole } from "@/types";

export type RouteKey =
    | "vieweraccess"
    | "uploadbuild"
    | "deletebuild"
    | "updateversions"
    | "manageprojects"
    | "manageenvironments"
    | "addemaildomain"
    | "addusers"
    | "promoteusers"
    | "mybuilds"
    | "viewallbuilds"
    | "graphicprojects"
    | "graphicprojectaccess"
    | "createticket"
    | "viewtickets"
    | "profileselection"

export const ROUTE_POLICY: Record<RouteKey, AccessRole[]> = {
    vieweraccess: ["ADMIN", "MANAGER"],
    uploadbuild: ["ADMIN", "DEV"],
    deletebuild: ["ADMIN","DEV"],
    updateversions: ["ADMIN", "DEV"],
    manageprojects: ["ADMIN", "DEV"],
    manageenvironments: ["ADMIN", "DEV"],
    addemaildomain: ["ADMIN", "MANAGER"],
    addusers: ["ADMIN", "MANAGER"],
    promoteusers: ["ADMIN", "MANAGER"],
    mybuilds: ["VIEWER"],
    viewallbuilds: ["ADMIN", "DEV", "MANAGER"],
    graphicprojects: ["ADMIN", "MANAGER"],
    graphicprojectaccess: ["ADMIN", "MANAGER", "REVIEWER"],
    createticket: ["ADMIN", "MANAGER", "REVIEWER"],
    viewtickets: ["ADMIN", "MANAGER", "DESIGNER", "REVIEWER"],
    profileselection: ["ADMIN", "MANAGER", "DEV", "VIEWER", "DESIGNER", "REVIEWER"],
};

export function canAccess(role: AccessRole, allowed: AccessRole[]) {
    return allowed.includes(role);
}
