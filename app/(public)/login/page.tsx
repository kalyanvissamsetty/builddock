/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "../../../components/lib/api";
import Image from "next/image";
import logo from "@/public/logos/logo.png";
import { Eye, EyeOff } from "lucide-react";
import { defaultRouteForRole } from "@/components/auth/defaultRoute";
import { useAuth } from "@/components/auth/useAuth";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const verified = params.get("verified");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { refreshMe } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const user = await refreshMe();
      localStorage.setItem("bd_has_session", "1");
      if (user) router.replace(defaultRouteForRole(user.role));
    } catch (e: any) {
      if (e instanceof ApiError && e.code === "EMAIL_NOT_VERIFIED" && e.redirectTo) {
        router.replace(e.redirectTo);
        return;
      }
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-4 flex-col min-h-screen items-center justify-center px-4">
      <Image
        src={logo}
        alt="Logo"
        width={150}
        height={10}
        priority
        className="rounded-lg"
      />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Sign in</CardTitle>
        </CardHeader>

        <CardContent>
          {verified && (
            <p className="mb-3 text-sm text-green-600">
              Email verified. Please sign in.
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
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-ms-editor="false"
                  className="pr-10"
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={!password}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Or{" "}
              <a href="/otplogin" className="underline">
                Sign in with OTP
              </a>
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don’t have an account?{" "}
            <a href="/signup" className="underline">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
