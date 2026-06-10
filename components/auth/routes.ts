import type { RouteKey } from "./policy";

export const ROUTES: Record<string, RouteKey> = {
    "/vieweraccess": "vieweraccess",
    "/uploadbuild": "uploadbuild",
    "/deletebuild": "deletebuild",
    "/updateversions": "updateversions",
    "/manageprojects": "manageprojects",
    "/manageenvironments": "manageenvironments",
    "/addemaildomain": "addemaildomain",
    "/addusers": "addusers",
    "/promoteusers": "promoteusers",
    "/mybuilds": "mybuilds",
    "/allbuilds": "viewallbuilds",
    "/graphicprojects": "graphicprojects",
    "/graphicprojectaccess": "graphicprojectaccess",
    "/assigntickets": "graphicprojectaccess",
    "/createticket": "createticket",
    "/viewtickets": "viewtickets",
    "/profileselection": "profileselection"
};
