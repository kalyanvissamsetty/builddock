/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { apiFetch } from "@/components/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Role } from "@/types";

type AllowedDomain = {
    id: number;
    domain: string;
    createdAt: string;
};

type InviteStatus = "PENDING" | "ACCEPTED" | "EXPIRED";

type Invite = {
    id: number;
    email: string;
    name?: string | null;
    status: InviteStatus;
    createdAt: string;
};


const ROLES: Role[] = ["VIEWER", "MANAGER","DEV"];

const LS_DOMAIN_KEY = "invite_selected_domain";
const LS_ROLE_KEY = "invite_selected_role";

function isValidLocalPart(input: string) {
    const v = input.trim();
    if (!v) return false;
    if (v.includes(" ")) return false;
    if (v.includes("@")) return false;
    return /^[a-zA-Z0-9._+-]+$/.test(v);
}

export default function InviteUsersPage() {
    const [domains, setDomains] = React.useState<AllowedDomain[]>([]);
    const [loadingDomains, setLoadingDomains] = React.useState(true);

    const [localPart, setLocalPart] = React.useState("");
    const [selectedDomain, setSelectedDomain] = React.useState<string | null>(null);

    const [selectedRole, setSelectedRole] = React.useState<Role | null>(null);

    const [name, setName] = React.useState("");
    const [sending, setSending] = React.useState(false);

    const [invites, setInvites] = React.useState<Invite[]>([]);
    const [loadingInvites, setLoadingInvites] = React.useState(false);

    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<"ALL" | InviteStatus>("ALL");

    // Restore last selected role/domain once on mount
    React.useEffect(() => {
        try {
            const savedDomain = localStorage.getItem(LS_DOMAIN_KEY);
            if (savedDomain) setSelectedDomain(savedDomain);

            const savedRole = localStorage.getItem(LS_ROLE_KEY);
            if (savedRole && ROLES.includes(savedRole as Role)) setSelectedRole(savedRole as Role);
        } catch {
            // ignore
        }
    }, []);

    // Persist selected domain
    React.useEffect(() => {
        if (!selectedDomain) return;
        try {
            localStorage.setItem(LS_DOMAIN_KEY, selectedDomain);
        } catch {
            // ignore
        }
    }, [selectedDomain]);

    // Persist selected role
    React.useEffect(() => {
        if (!selectedRole) return;
        try {
            localStorage.setItem(LS_ROLE_KEY, selectedRole);
        } catch {
            // ignore
        }
    }, [selectedRole]);

    async function loadDomains() {
        setLoadingDomains(true);
        try {
            const data = await apiFetch<AllowedDomain[]>("/api/admin/allowed-domains");
            const list = Array.isArray(data) ? data : [];
            setDomains(list);

            // Ensure selectedDomain is valid after loading domains
            if (list.length > 0) {
                const saved = (() => {
                    try {
                        return localStorage.getItem(LS_DOMAIN_KEY);
                    } catch {
                        return null;
                    }
                })();

                const candidate = selectedDomain || saved;
                const exists = candidate && list.some((d) => d.domain === candidate);

                if (exists) {
                    setSelectedDomain(candidate as string);
                } else {
                    setSelectedDomain(list[0].domain);
                }
            } else {
                setSelectedDomain(null);
            }

            // Ensure role has a default (nice UX)
            if (!selectedRole) {
                const savedRole = (() => {
                    try {
                        return localStorage.getItem(LS_ROLE_KEY);
                    } catch {
                        return null;
                    }
                })();

                if (savedRole && ROLES.includes(savedRole as Role)) setSelectedRole(savedRole as Role);
                else setSelectedRole("VIEWER");
            }
        } catch (e: any) {
            toast.error(e?.message ?? "Failed to load domains");
            setDomains([]);
            setSelectedDomain(null);
        } finally {
            setLoadingDomains(false);
        }
    }

    async function loadInvites() {
        setLoadingInvites(true);
        try {
            const data = await apiFetch<Invite[]>("/api/admin/invites");
            setInvites(Array.isArray(data) ? data : []);
        } catch {
            setInvites([]);
        } finally {
            setLoadingInvites(false);
        }
    }

    React.useEffect(() => {
        loadDomains();
        loadInvites();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fullEmail = React.useMemo(() => {
        if (!selectedDomain) return "";
        const lp = localPart.trim();
        if (!lp) return "";
        return `${lp}@${selectedDomain}`;
    }, [localPart, selectedDomain]);

    const canSend = React.useMemo(() => {
        if (loadingDomains) return false;
        if (!selectedDomain) return false;
        if (!selectedRole) return false;
        if (!isValidLocalPart(localPart)) return false;
        return true;
    }, [loadingDomains, selectedDomain, selectedRole, localPart]);

    const filteredInvites = React.useMemo(() => {
        const q = search.trim().toLowerCase();

        return invites.filter((i) => {
            const matchesSearch = !q || i.email.toLowerCase().includes(q);
            const matchesStatus = statusFilter === "ALL" ? true : i.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [invites, search, statusFilter]);

    async function sendInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!canSend) return;

        setSending(true);
        try {
            const email = fullEmail.toLowerCase();

            const resp = await apiFetch<{ message: string }>(
                "/api/admin/invites",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email,
                        name: name.trim() ? name.trim() : undefined,
                        role: selectedRole,
                    }),
                },
            );

            toast.success(resp?.message ?? "Invite sent");

            // Reset only fields that change per-invite
            setLocalPart("");
            setName("");

            // Keep domain + role selected for fast repeated invites
            await loadInvites();
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to send invite");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="w-full max-w-4xl">
            <div className="mb-4">
                <h1 className="text-2xl font-semibold">Invite Users (OTP)</h1>
                <p className="text-sm text-muted-foreground">
                    You can Invite users from allowed domains. Users can sign in with OTP.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
                {/* Left: Invite form */}
                <Card className="self-start">
                    <CardHeader className="pb-3">
                        <CardTitle>Send Invite</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {loadingDomains ? (
                            <p className="text-sm text-muted-foreground">Loading domains...</p>
                        ) : domains.length === 0 ? (
                            <p className="text-sm text-destructive">
                                No allowed domains. Add a domain first.
                            </p>
                        ) : (
                            <form onSubmit={sendInvite} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>User name (optional)</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Full name"
                                        disabled={sending}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select
                                        value={selectedRole ?? undefined}
                                        onValueChange={(v) => setSelectedRole(v as Role)}
                                        disabled={sending}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map((r) => (
                                                <SelectItem key={r} value={r}>
                                                    {r}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Admin invites cannot assign ADMIN role.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Email</Label>

                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px]">
                                        <Input
                                            value={localPart}
                                            onChange={(e) => setLocalPart(e.target.value)}
                                            placeholder="username"
                                            disabled={sending}
                                        />

                                        <Select
                                            value={selectedDomain ?? undefined}
                                            onValueChange={(v) => setSelectedDomain(v)}
                                            disabled={sending}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Domain" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {domains.map((d) => (
                                                    <SelectItem key={d.id} value={d.domain}>
                                                        {d.domain}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="text-xs text-muted-foreground">
                                        {fullEmail ? (
                                            <span>
                                                Full email: <span className="font-medium">{fullEmail}</span>
                                            </span>
                                        ) : (
                                            <span>Enter username and choose domain</span>
                                        )}
                                    </div>

                                    {localPart && !isValidLocalPart(localPart) && (
                                        <p className="text-xs text-destructive">
                                            Only letters, numbers, dot, underscore, plus and hyphen are allowed. Do not type @.
                                        </p>
                                    )}
                                </div>

                                <Button type="submit" disabled={!canSend || sending}>
                                    {sending ? "Sending..." : "Send OTP Invite"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Invites list */}
                <Card className="flex flex-col">
                    <CardHeader className="space-y-3 pb-3">
                        <CardTitle>Invites</CardTitle>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px]">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by email..."
                            />

                            <Select
                                value={statusFilter}
                                onValueChange={(v) => setStatusFilter(v as any)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                                    <SelectItem value="EXPIRED">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Total</p>
                            <Badge variant="secondary">{invites.length}</Badge>
                        </div>

                        <ScrollArea className="h-80 pr-3">
                            {loadingInvites ? (
                                <p className="text-sm text-muted-foreground">Loading invites...</p>
                            ) : filteredInvites.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No invites found.</p>
                            ) : (
                                <div className="space-y-2">
                                    {filteredInvites.map((inv) => (
                                        <div key={inv.id} className="rounded-md border p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">
                                                        {inv.name ? `${inv.name} - ${inv.email}` : inv.email}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Status: {inv.status}
                                                    </p>
                                                </div>
                                                <Badge variant="outline">{inv.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Showing {filteredInvites.length} result(s)
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadInvites}
                                disabled={loadingInvites}
                            >
                                {loadingInvites ? "Refreshing..." : "Refresh"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}