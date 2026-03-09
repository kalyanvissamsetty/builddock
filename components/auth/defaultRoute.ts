import type { Role } from "@/types";

export function defaultRouteForRole(role: Role) {
    console.log("Role in defaultRouteForRole: " + role)
    switch (role) {
        case "ADMIN":
            return "/vieweraccess";
        case "MANAGER":
            return "/vieweraccess"
        case "DEV":
            return "/uploadbuild";
        case "QA":
            return "/updateversions";
        case "VIEWER":
            return "/viewbuilds";
        default:
            return "/";
    }
}