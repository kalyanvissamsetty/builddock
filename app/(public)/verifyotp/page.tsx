/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/components/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clipboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { defaultRouteForRole } from "@/components/auth/defaultRoute";
import { Me } from "@/types";
import { useAuth } from "@/components/auth/useAuth";
import { getAppName, getLogoFromWindowOrigin } from "@/components/Helpers/TenantRules";


function VerifyOtpForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { refreshMe, logout } = useAuth();

  const email = (params.get("email") || "").trim().toLowerCase();
  const reason = params.get("reason") || "";

  const [me, setMe] = useState<Me | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [switching, setSwitching] = useState(false);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const isLoginFlow = useMemo(() => {
    return reason === "otp-login" || reason === "invite";
  }, [reason]);

  const pageTitle = isLoginFlow ? "Sign in with OTP" : "Verify Your Email";
  const helperText = email
    ? `Enter the 6-digit code sent to ${email}`
    : "Enter the 6-digit code sent to your email";

  const needsSwitch = useMemo(() => {
    if (!meLoaded) return false;
    if (!me?.email) return false;
    if (!email) return false;
    return me.email.toLowerCase() !== email;
  }, [meLoaded, me, email]);

  // Load current user session
  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      try {
        const data = await apiFetch<Me>("/api/auth/me", { method: "GET" });
        if (mounted) setMe(data);
      } catch {
        if (mounted) setMe(null);
      } finally {
        if (mounted) setMeLoaded(true);
      }
    }

    loadMe();
    return () => {
      mounted = false;
    };
  }, []);

  // Hide success after 10 seconds
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 10000);
    return () => clearTimeout(t);
  }, [success]);

  // Cooldown tick
  useEffect(() => {
    if (cooldown <= 0) return;
    const i = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(i);
  }, [cooldown]);

  async function resendOtp() {
    if (!email) {
      setError("Email is missing");
      return;
    }

    try {
      setResendLoading(true);
      setError(null);

      const endpoint =
        isLoginFlow ? "/api/auth/request-otp" : "/api/auth/resend-otp";

      await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setCooldown(60);
      setSuccess("OTP sent to your email.");
    } catch (e: any) {
      setError(e.message || "Failed to send OTP");
    } finally {
      setResendLoading(false);
    }
  }

  async function logoutAndContinue() {
    if (!email) return;

    setSwitching(true);
    setError(null);

    try {
      await logout()
      // Clear local session immediately
      setMe(null);
      // Hard refresh so cookies + middleware state re-evaluates
      window.location.href = `/verifyotp?email=${encodeURIComponent(email)}&reason=${encodeURIComponent(
        reason,
      )}&switched=1`;
    } catch (e: any) {
      setError(e?.message ?? "Failed to logout");
      setSwitching(false);
    }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.replace(/\D/g, "").slice(0, 6);
      if (!cleaned) return;
      setOtp(cleaned);
    } catch {
      // ignore
    }
  }

  async function handleVerify() {
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Email is missing");
      return;
    }

    if (otp.length !== 6) {
      setError("Enter valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      await apiFetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });

      setSuccess(isLoginFlow ? "Logged in successfully" : "Verified successfully");

      setTimeout(async () => {
        const user = await refreshMe();
        localStorage.setItem("bd_has_session", "1");
        if (user) router.replace(defaultRouteForRole(user.role));
      }, 900);
    } catch (e: any) {
      setError(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  // UI blocks
  const LoadingUI = (
    <div className="flex flex-col gap-4 min-h-screen items-center justify-center px-4">
      <Image
        src={getLogoFromWindowOrigin()}
        alt="Logo"
        width={150}
        height={10}
        priority
        className="rounded-lg"
      />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Loading...</CardTitle>
          <p className="text-sm text-muted-foreground">Checking your session</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please wait</p>
        </CardContent>
      </Card>
    </div>
  );

  const SwitchUI = (
    <div className="flex flex-col gap-4 min-h-screen items-center justify-center px-4">
      <Image
        src={getLogoFromWindowOrigin()}
        alt="Logo"
        width={150}
        height={10}
        priority
        className="rounded-lg"
      />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Switch account to continue</CardTitle>
          <p className="text-sm text-muted-foreground">
            You are currently signed in as{" "}
            <span className="font-medium">{me?.email}</span>. This invite is for{" "}
            <span className="font-medium">{email}</span>.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            To accept this invite, log out and continue as {email}.
          </div>
          <Button className="w-full" onClick={logoutAndContinue} disabled={switching}>
            {switching ? "Switching..." : `Continue as ${email}`}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.replace("/")}
            disabled={switching}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const OtpUI = (
    <div className="flex flex-col gap-4 min-h-screen items-center justify-center px-4">
      <Image
        src={getLogoFromWindowOrigin()}
        alt="Logo"
        width={150}
        height={10}
        priority
        className="rounded-lg"
      />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">{pageTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{helperText}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {reason === "invite" && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
              You were invited to access {getAppName()}. Use the OTP from the email to sign in.
              If it expired, you can resend a new OTP below.
            </div>
          )}

          {reason === "otp-login" && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
              Enter the OTP to sign in. If you did not receive it, you can resend a new OTP below.
            </div>
          )}

          {reason === "not-verified" && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 border border-yellow-200">
              Your account is not verified. Please complete verification to continue.
            </div>
          )}
          {reason === "invited-no-password" && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 border border-yellow-200">
              You are an invited user to {getAppName()}. But you haven&apos;t set your password yet. Please enter the OTP sent to your mail to login. <br /><br/><b>Please create your password in the Profile section after login.</b>
            </div>
          )}

          <div className="relative">
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter OTP"
              maxLength={6}
              className="pr-10"
              disabled={loading}
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  <Clipboard size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Paste OTP</TooltipContent>
            </Tooltip>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200">
              {success}
            </div>
          )}

          <Button className="w-full" onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying..." : isLoginFlow ? "Sign in" : "Verify"}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={resendOtp}
            disabled={!email || cooldown > 0 || resendLoading}
          >
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : resendLoading
                ? "Sending..."
                : "Resend OTP"}
          </Button>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Go back to{" "}
        <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
          Login
        </Link>{" "}
        or{" "}
        <Link href="/signup" className="underline underline-offset-4 hover:text-foreground">
          Signup
        </Link>
        ?
      </p>
    </div>
  );

  // Final render decision (no early returns before hooks)
  if (!meLoaded) return LoadingUI;
  if (needsSwitch) return SwitchUI;
  return OtpUI;
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}