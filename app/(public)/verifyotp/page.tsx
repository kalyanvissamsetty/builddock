"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/components/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clipboard } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Me } from "@/components/lib/auth";

function VerifyOtpForm() {
  const params = useSearchParams();
  const router = useRouter();

  const email = params.get("email") || "";
  const reason = params.get("reason");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const [autoTriggered, setAutoTriggered] = useState(false);

  useEffect(() => {
    if (!email) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [email]);

  useEffect(() => {
    if (reason === "not-verified" && email && !autoTriggered) {
      autoResendOtp();
      setAutoTriggered(true);
    }
  }, [reason, email]);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess(null);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [success]);

  async function autoResendOtp() {
    try {
      await apiFetch("/api/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setCooldown(60);
      setSuccess("A new OTP has been sent to your email.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message || "Failed to resend OTP");
    }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();

      // Extract only digits
      const cleaned = text.replace(/\D/g, "");

      // Limit to 6 digits (or your OTP length)
      const otpValue = cleaned.slice(0, 6);

      if (otpValue.length === 0) return;

      setOtp(otpValue);
    } catch (err) {
      console.error("Clipboard access failed");
    }
  }

  async function handleVerify() {
    setError(null);
    setSuccess(null);

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

      setSuccess("Email verified successfully");

      setTimeout(() => {
        router.replace("/");
      }, 1500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;

    try {
      setResendLoading(true);
      setError(null);

      await apiFetch("/api/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setCooldown(60);
      setSuccess("OTP resent successfully");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Verify Your Email</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to {email}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {reason === "not-verified" && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 border border-yellow-200">
              Your account is not verified. Please complete verification to
              continue.
            </div>
          )}
          <div className="relative">
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter OTP"
              maxLength={6}
              className="pr-10"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={cooldown > 0 || resendLoading}
          >
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : resendLoading
                ? "Sending..."
                : "Resend OTP"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
