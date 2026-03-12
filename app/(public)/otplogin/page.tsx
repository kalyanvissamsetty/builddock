"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/components/lib/api";
import Image from "next/image";
import { getLogoFromWindowOrigin } from "@/components/Helpers/TenantRules";

function LoginOtpForm() {
    const router = useRouter();
    const params = useSearchParams();

    const emailFromQuery = params.get("email") || "";
    const auto = params.get("auto") === "1"; // only auto-send if explicitly asked

    const [email, setEmail] = useState(emailFromQuery);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // prevents duplicate auto-send during rerenders
    const autoSentRef = useRef(false);

    useEffect(() => {
        if (!emailFromQuery) return;
        setEmail(emailFromQuery);

        // do not auto-send unless auto=1
        if (!auto) return;

        if (autoSentRef.current) return;
        autoSentRef.current = true;

        void requestOtp(emailFromQuery);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emailFromQuery, auto]);

    async function requestOtp(targetEmail: string) {
        setError(null);
        setLoading(true);
        try {
            await apiFetch("/api/auth/request-otp", {
                method: "POST",
                body: JSON.stringify({ email: targetEmail }),
            });

            // Redirect to verify page after sending OTP
            router.replace(
                `/verifyotp?email=${encodeURIComponent(targetEmail)}&reason=otp-login`,
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setError(e.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const em = email.trim().toLowerCase();
        if (!em) {
            setError("Email is required");
            return;
        }
        await requestOtp(em);
    }

    return (
        <div className="flex gap-4 flex-col min-h-screen items-center justify-center px-4">
            <Image
                src={getLogoFromWindowOrigin()}
                alt="Logo"
                width={150}
                height={10}
                priority
                className="rounded-lg"
            />

            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-center text-2xl">Sign in with OTP</CardTitle>
                </CardHeader>

                <CardContent>
                    {emailFromQuery && !auto && (
                        <p className="mb-3 text-sm text-muted-foreground">
                            Email prefilled from invite. Click below to send OTP.
                        </p>
                    )}

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button className="w-full" disabled={loading}>
                            {loading ? "Sending OTP..." : "Send OTP"}
                        </Button>
                    </form>

                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        Prefer password?{" "}
                        <a href="/login" className="underline">
                            Sign in
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function LoginOtpPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginOtpForm />
        </Suspense>
    );
}