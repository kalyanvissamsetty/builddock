import { ROUTES } from "./routes";
import { ROUTE_POLICY } from "./policy";
import { AccessRole, Me, ReviewDomain } from "@/types";
import { getAllowedDomains, getDomainRole } from "./domain";

const WEBGL_PATHS = new Set([
    "/vieweraccess",
    "/uploadbuild",
    "/deletebuild",
    "/updateversions",
    "/manageprojects",
    "/manageenvironments",
    "/mybuilds",
    "/allbuilds",
]);

const GRAPHICS_PATHS = new Set([
    "/graphicprojects",
    "/graphicprojectaccess",
    "/assigntickets",
    "/createticket",
    "/viewtickets",
]);

const SHARED_PATHS = new Set([
    "/addemaildomain",
    "/addusers",
    "/promoteusers",
    "/profileselection",
]);

export function cleanPathname(pathname: string) {
    return pathname.split("?")[0].split("#")[0];
}

export function domainForPath(pathname: string): ReviewDomain | "SHARED" | null {
    const cleanPath = cleanPathname(pathname);
    if (WEBGL_PATHS.has(cleanPath)) return "WEBGL";
    if (GRAPHICS_PATHS.has(cleanPath)) return "GRAPHICS";
    if (SHARED_PATHS.has(cleanPath)) {
        const query = pathname.split("?")[1] ?? "";
        const module = new URLSearchParams(query).get("module");
        if (module === "GRAPHICS" || module === "WEBGL") return module;
        return "SHARED";
    }
    return null;
}

export function allowedRolesForPath(pathname: string): AccessRole[] | null {
    const cleanPath = cleanPathname(pathname);
    const key = ROUTES[cleanPath];
    return key ? ROUTE_POLICY[key] : null;
}

export function canAccessPath(role: AccessRole, pathname: string): boolean {
    const allowed = allowedRolesForPath(pathname);
    if (!allowed) return true; // relaxed
    return allowed.includes(role);
}

export function canAccessPathForMe(me: Me, pathname: string, selectedDomain: ReviewDomain): boolean {
    const cleanPath = cleanPathname(pathname);
    const routeDomain = domainForPath(cleanPath);
    const allowedDomains = getAllowedDomains(me);

    if (cleanPath === "/profileselection") return allowedDomains.length > 1;

    if (routeDomain && routeDomain !== "SHARED" && routeDomain !== selectedDomain) return false;
    if (routeDomain && routeDomain !== "SHARED" && !allowedDomains.includes(routeDomain)) return false;

    const effectiveDomain = routeDomain === "SHARED" || !routeDomain ? selectedDomain : routeDomain;
    const role = getDomainRole(me, effectiveDomain);
    if (!role) return false;
    return canAccessPath(role, cleanPath);
}
