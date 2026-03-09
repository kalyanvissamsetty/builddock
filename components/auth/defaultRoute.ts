import type { Role } from "@/types";

export function defaultRouteForRole(role: Role) {
    switch (role) {
        case "ADMIN":
            return "/allbuilds";
        case "MANAGER":
            return "/allbuilds"
        case "DEV":
            return "/allbuilds";
        case "VIEWER":
            return "/mybuilds";
        default:
            return "/";
    }
}