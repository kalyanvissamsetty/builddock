import { ROUTES } from "./routes";
import { ROUTE_POLICY } from "./policy";
import { Role } from "@/types";

export function allowedRolesForPath(pathname: string): Role[] | null {
    const key = ROUTES[pathname];
    return key ? ROUTE_POLICY[key] : null;
}

export function canAccessPath(role: Role, pathname: string): boolean {
    const allowed = allowedRolesForPath(pathname);
    if (!allowed) return true; // relaxed
    return allowed.includes(role);
}