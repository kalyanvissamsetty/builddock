"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "../../../components/lib/api";
import Image from "next/image";
import logo from "@/public/logos/logo.png";
import PasswordRules from "@/components/Helpers/PasswordRules";
export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRules = {
    minLength: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const isNameValid = name.trim().length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const isFormValid =
    isNameValid &&
    isEmailValid &&
    isPasswordValid &&
    !loading; 
    
  async function onSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError(null);
      setLoading(true);
      if (!name.trim()) {
        throw Error("Name is required");
      }
      try {
        await apiFetch("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({ email, password, name }),
        });

        setSuccess(true);
        router.replace(`/verifyotp?email=${encodeURIComponent(email)}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

  return (
    <div className="flex flex-col gap-4 min-h-screen items-center justify-center bg-muted px-4">
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
          <CardTitle className="text-center text-2xl">Create account</CardTitle>
        </CardHeader>

        <CardContent>
          {success ? (
            <p className="text-sm text-green-600">
              Account created. Check your email to activate your account with
              OTP.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                  {!isNameValid && name.length > 0 && (
                    <p className="text-xs text-destructive">
                      Name is required
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="name@tims.group"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                  {email && !isEmailValid && (
                    <p className="text-xs text-destructive">
                      Enter a valid email address
                    </p>
                  )}
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {password.length > 0 && <PasswordRules rules={passwordRules} /> && <PasswordRules rules={passwordRules} />
                }
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

                <Button className="w-full" disabled={!isFormValid} aria-disabled={!isFormValid}>
                {loading ? "Creating..." : "Sign up"}
              </Button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="underline">
              Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
