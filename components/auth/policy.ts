import { Role } from "@/types";

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

export const ROUTE_POLICY: Record<RouteKey, Role[]> = {
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
    viewallbuilds: ["ADMIN", "DEV", "MANAGER"]
};

export function canAccess(role: Role, allowed: Role[]) {
    return allowed.includes(role);
}