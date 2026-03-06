import { NextRequest, NextResponse } from "next/server";

const BLOCK_PUBLIC_WHEN_LOGGED_IN = ["/login", "/signup", "/login-otp"];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const access = req.cookies.get("timsstudio_access")?.value;
    const isLoggedIn = Boolean(access);

    if (!isLoggedIn) {
        return NextResponse.next();
    }

    // If logged in, block certain public pages
    const shouldBlock = BLOCK_PUBLIC_WHEN_LOGGED_IN.some((p) =>
        pathname.startsWith(p),
    );

    if (shouldBlock) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        url.search = "";
        return NextResponse.redirect(url);
    }

    // Allow verifyotp even when logged in (needed for invite switching)
    return NextResponse.next();
}

export const config = {
    matcher: ["/login", "/signup", "/login-otp", "/verifyotp"],
};