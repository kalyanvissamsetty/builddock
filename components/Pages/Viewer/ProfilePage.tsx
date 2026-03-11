/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/components/lib/api";
import { useAuth } from "@/components/auth/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { defaultRouteForRole } from "@/components/auth/defaultRoute";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
type ProfileResponse = {
    id: number;
    name: string;
    email: string;
    role: string;
    hasPassword: boolean;
};

function validatePassword(password: string) {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }

    return errors;
}

type PasswordInputProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
};

function PasswordInput({
    label,
    value,
    onChange,
    placeholder,
}: PasswordInputProps) {
    const [show, setShow] = useState(false);

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>

            <div className="relative">
                <Input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="pr-10"
                />

                <button
                    type="button"
                    onClick={() => setShow((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}

export function ProfilePage() {
    const { me, refreshMe } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [hasPassword, setHasPassword] = useState(true);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordResetKey, setPasswordResetKey] = useState(0);
    useEffect(() => {
        let mounted = true;

        async function loadProfile() {
            try {
                const data = await apiFetch<ProfileResponse>("/api/profile", {
                    method: "GET",
                });

                if (!mounted) return;

                setName(data.name ?? "");
                setEmail(data.email ?? "");
                setHasPassword(data.hasPassword);
                
            } catch (error) {
                console.error(error);
                toast.error("Failed to load profile");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadProfile();

        return () => {
            mounted = false;
        };
    }, []);

    const passwordErrors = useMemo(() => validatePassword(newPassword), [newPassword]);

    const passwordsMatch =
        newPassword.length > 0 &&
        confirmPassword.length > 0 &&
        newPassword === confirmPassword;

    async function handleProfileUpdate() {
        const trimmedName = name.trim();

        if (!trimmedName) {
            toast.error("Name is required");
            return;
        }

        if (trimmedName.length < 2 || trimmedName.length > 50) {
            toast.error("Name must be between 2 and 50 characters");
            return;
        }
        try {
            setSavingProfile(true);

            const data: any = await apiFetch("/api/profile", {
                method: "PATCH",
                body: JSON.stringify({ name: trimmedName }),
            });

            await refreshMe();
            toast.success(data?.message);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || "Failed to update profile");
        } finally {
            setSavingProfile(false);
        }
    }

    async function handlePasswordUpdate() {
        if (!newPassword || !confirmPassword) {
            toast.error("Please fill all password fields");
            return;
        }

        if (hasPassword && !oldPassword) {
            toast.error("Please enter your current password");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New password and confirm password do not match");
            return;
        }

        if (passwordErrors.length > 0) {
            toast.error(passwordErrors[0]);
            return;
        }

        try {
            setSavingPassword(true);

            await apiFetch("/api/profile/password", {
                method: "PATCH",
                body: JSON.stringify({
                    oldPassword: hasPassword ? oldPassword : undefined,
                    newPassword,
                }),
            });
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setHasPassword(true);
            setPasswordResetKey((prev) => prev + 1);
            toast.success(
                hasPassword ? "Password updated successfully" : "Password set successfully"
            );
        } catch (error: any) {
            toast.error(error?.message || "Failed to save password");
        } finally {
            setSavingPassword(false);
        }
    }

    function handleGoBack() {
        router.push(defaultRouteForRole(me?.role ?? "VIEWER"))
    }

    if (loading) {
        return (
            <LoadingScreen
                    title="Loading Profile"
                    description="Please wait..."
                    fullScreen
                  />
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">My Profile</h1>
                    <p className="text-sm text-muted-foreground">
                        Update your personal details and password
                    </p>
                </div>

                <Button variant="outline" onClick={handleGoBack} className="w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border bg-card p-6 space-y-5">
                    <div>
                        <h2 className="text-lg font-medium">Profile Details</h2>
                        <p className="text-sm text-muted-foreground">
                            You can update your name here
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input value={email} readOnly disabled />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <Input value={me?.role ?? ""} readOnly disabled />
                    </div>

                    <Button
                        onClick={handleProfileUpdate}
                        disabled={savingProfile}
                        className="w-full"
                    >
                        {savingProfile ? "Saving..." : "Update Profile"}
                    </Button>
                </div>

                <div className="rounded-lg border bg-card p-6 space-y-5">
                    <div>
                        <h2 className="text-lg font-medium">
                            {hasPassword ? "Change Password" : "Set Password"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {hasPassword
                                ? "Enter your current password and choose a new one"
                                : "You were invited by email. Please set your password to secure your account"}
                        </p>
                    </div>

                    {hasPassword && (
                        <PasswordInput
                            key={`current-${passwordResetKey}`}
                            label="Current Password"
                            value={oldPassword}
                            onChange={setOldPassword}
                            placeholder="Enter current password"
                        />
                    )}

                    <PasswordInput
                        key={`new-${passwordResetKey}`}
                        label={hasPassword ? "New Password" : "Password"}
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder={hasPassword ? "Enter new password" : "Create a password"}
                    />

                    <PasswordInput
                        key={`confirm-${passwordResetKey}`}
                        label={hasPassword ? "Confirm New Password" : "Confirm Password"}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Confirm password"
                    />

                    {newPassword && passwordErrors.length > 0 && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                            <p className="mb-2 text-sm font-medium text-destructive">
                                Password must satisfy:
                            </p>
                            <ul className="list-disc pl-5 text-sm text-destructive space-y-1">
                                {passwordErrors.map((error) => (
                                    <li key={error}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {passwordsMatch && passwordErrors.length === 0 && (
                        <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3">
                            <p className="text-sm font-medium text-green-700">
                                Passwords are matched
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={handlePasswordUpdate}
                        disabled={savingPassword}
                        className="w-full"
                    >
                        {savingPassword
                            ? hasPassword
                                ? "Updating..."
                                : "Setting..."
                            : hasPassword
                                ? "Update Password"
                                : "Set Password"}
                    </Button>
                </div>
            </div>
        </div>
    );
}