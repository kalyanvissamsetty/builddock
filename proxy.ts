import { NextRequest, NextResponse } from "next/server";

const BLOCK_PUBLIC_WHEN_LOGGED_IN = ["/login", "/signup", "/login-otp"];

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const access = req.cookies.get("timsstudio_access")?.value;
    const isLoggedIn = Boolean(access);

    if (isLoggedIn) {
        const shouldBlock = BLOCK_PUBLIC_WHEN_LOGGED_IN.some((p) =>
            pathname.startsWith(p),
        );

        if (shouldBlock) {
            const url = req.nextUrl.clone();
            url.pathname = "/";
            url.search = "";
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/login", "/signup", "/login-otp", "/verifyotp"],
};