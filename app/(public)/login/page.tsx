"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "../../../components/lib/api";
import Image from "next/image";
import logo from "@/public/logos/logo.png";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const verified = params.get("verified");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.replace("/");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e.code === "EMAIL_NOT_VERIFIED") {
        router.replace(
          `/verifyotp?email=${encodeURIComponent(email)}&reason=not-verified`,
        );
      } else {
        setError(e.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-4 flex-col min-h-screen items-center justify-center bg-muted px-4">
      <Image
        src={logo}
        alt="BuildDock Logo"
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
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

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
