/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { apiFetch } from "@/components/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; 
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
import { Label } from "@/components/ui/label";
import BuildSelect, { BuildSelectValue } from "../BuildSelect";
import { useAuth } from "@/components/auth/useAuth";
import { DOMAIN_LABELS, useSelectedDomain } from "@/components/auth/domain";

type InviteModule = "WEBGL" | "GRAPHICS";
type InviteRole = string;

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
    module?: InviteModule;
    role?: string;
};

type RoleOption = {
    id: number;
    key: string;
    displayName: string;
    module: InviteModule;
};

const LS_ROLE_KEY = "invite_selected_role";


function parseEmails(text: string) {
    return text
        .split(/\r?\n/g)
        .map((s) => s.trim())
        .filter(Boolean);
}

function countLines(text: string) {
    if (!text) return 1;
    return text.split(/\r?\n/g).length;
}

function autoRows(text: string) {
    return Math.min(30, Math.max(4, countLines(text)));
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export default function InviteUsersPage() {
    const { me } = useAuth();
    const { selectedDomain } = useSelectedDomain(me);
    const [domains, setDomains] = React.useState<AllowedDomain[]>([]);
    const [loadingDomains, setLoadingDomains] = React.useState(true);
    const [roles, setRoles] = React.useState<RoleOption[]>([]);
    const [loadingRoles, setLoadingRoles] = React.useState(true);

    const selectedModule = selectedDomain as InviteModule;
    const [selectedRole, setSelectedRole] = React.useState<InviteRole | null>(null);
    const [sending, setSending] = React.useState(false);

    const [emailsText, setEmailsText] = React.useState("");

    const [invites, setInvites] = React.useState<Invite[]>([]);
    const [loadingInvites, setLoadingInvites] = React.useState(false);

    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<"ALL" | InviteStatus>("ALL");

    const [bulkReport, setBulkReport] = React.useState<null | {
        requested: number;
        requestedTotal?: number;
        mailAttempts?: number;
        sent: number;
        failed: number;
        blockedAlreadyVerified?: number;
        blockedAlreadyVerifiedEmails?: string[];
        blockedAlreadyAccepted?: number;
        blockedAlreadyAcceptedEmails?: string[];
        blockedAlreadyPending?: number;
        blockedAlreadyPendingEmails?: string[];
        resentExpired?: number;
        resentExpiredEmails?: string[];
        results: { email: string; ok: boolean; status?: any; message?: any }[];
    }>(null);

    const [buildSel, setBuildSel] = React.useState<BuildSelectValue>({
        projectId: null,
        envId: null,
        versionId: null,
    });
    const shouldAssignBuild = selectedModule === "WEBGL" && selectedRole === "VIEWER";

    React.useEffect(() => {
        if (!emailsText) return;
        setBulkReport(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emailsText]);

    // Persist selected role
    React.useEffect(() => {
        if (!selectedRole) return;
        try {
            localStorage.setItem(LS_ROLE_KEY, selectedRole);
        } catch {
            // ignore
        }
    }, [selectedModule, selectedRole]);

    React.useEffect(() => {
        if (roles.length === 0) {
            setSelectedRole(null);
            return;
        }

        if (selectedRole && roles.some((role) => role.key === selectedRole)) return;

        try {
            const savedRole = localStorage.getItem(LS_ROLE_KEY);
            const savedRoleIsAllowed = roles.some((role) => role.key === savedRole);
            setSelectedRole(savedRoleIsAllowed ? savedRole : roles[0].key);
        } catch {
            setSelectedRole(roles[0].key);
        }
    }, [roles, selectedRole]);

    async function loadRoles() {
        setLoadingRoles(true);
        try {
            const data = await apiFetch<RoleOption[]>(`/api/admin/roles?module=${selectedModule}`);
            setRoles(Array.isArray(data) ? data : []);
        } catch (e: any) {
            toast.error(e?.message ?? "Failed to load roles");
            setRoles([]);
        } finally {
            setLoadingRoles(false);
        }
    }

    async function loadDomains() {
        setLoadingDomains(true);
        try {
            const data = await apiFetch<AllowedDomain[]>(`/api/admin/allowed-domains?module=${selectedModule}`);
            const list = Array.isArray(data) ? data : [];
            setDomains(list);
        } catch (e: any) {
            toast.error(e?.message ?? "Failed to load domains");
            setDomains([]);
        } finally {
            setLoadingDomains(false);
        }
    }

    const loadInvites = React.useCallback(async () => {
        setLoadingInvites(true);
        try {
            const data = await apiFetch<Invite[]>(`/api/admin/invites?module=${selectedModule}`);
            setInvites(Array.isArray(data) ? data : []);
        } catch {
            setInvites([]);
        } finally {
            setLoadingInvites(false);
        }
    }, [selectedModule]);

    React.useEffect(() => {
        setDomains([]);
        setRoles([]);
        setSelectedRole(null);
        loadDomains();
        loadRoles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedModule]);

    React.useEffect(() => {
        setInvites([]);
        setBulkReport(null);
        setBuildSel({ projectId: null, envId: null, versionId: null });
        loadInvites();
    }, [loadInvites]);

    React.useEffect(() => {
        if (shouldAssignBuild) return;
        setBuildSel({ projectId: null, envId: null, versionId: null });
    }, [shouldAssignBuild]);

    const canSend = React.useMemo(() => {
        if (loadingDomains) return false;
        if (loadingRoles) return false;
        if (!selectedRole) return false;

        const emails = parseEmails(emailsText);
        if (emails.length === 0) return false;
        if (emails.length > 30) return false;

        // basic validation
        if (emails.some((e) => !isValidEmail(e))) return false;

        return true;
    }, [loadingDomains, loadingRoles, selectedRole, emailsText]);

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
        if (!selectedRole) return;

        const emails = parseEmails(emailsText).map((e) => e.toLowerCase());
        if (emails.length === 0) return;

        if (emails.length > 30) {
            toast.error("Max 30 emails at a time");
            return;
        }

        const invalid = emails.filter((em) => !isValidEmail(em));
        if (invalid.length > 0) {
            toast.error(`Invalid emails: ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? "..." : ""}`);
            return;
        }

        setSending(true);
        try {
            if (shouldAssignBuild && !buildSel.versionId) {
                toast.error("Select a build for viewer invite");
                return;
            }
            const resp = await apiFetch<any>("/api/admin/invites/bulk", {
                method: "POST",
                body: JSON.stringify({
                    emails,
                    role: selectedRole,
                    module: selectedModule,
                    versionId: shouldAssignBuild ? buildSel.versionId : undefined
                }),
            });

            const result = resp?.result;
            if (result) {
                setBulkReport(result);
                const requestedTotal = result.requestedTotal ?? result.requested;
                const skippedPending = result.blockedAlreadyPending ?? 0;
                const skippedVerified = result.blockedAlreadyVerified ?? 0;
                toast.success(`Requested: ${requestedTotal}, Sent: ${result.sent}, Failed: ${result.failed}, Already invited: ${skippedPending}, Already verified: ${skippedVerified}`);
                
            } else {
                setBulkReport(null);
                toast.success("Invites processed");
            }
            
            // reset input box but keep role
            setEmailsText("");
            if (shouldAssignBuild) setBuildSel({ projectId: null, envId: null, versionId: null })

            await loadInvites();
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to send invites");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="w-full max-w-4xl">
            <div className="mb-4">
                <h1 className="text-2xl font-semibold">Invite Users (OTP)</h1>
                <p className="text-sm text-muted-foreground">
                    Invite users into {DOMAIN_LABELS[selectedModule]}. Users can sign in with OTP.
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
                        ) : loadingRoles ? (
                            <p className="text-sm text-muted-foreground">Loading roles...</p>
                        ) : domains.length === 0 ? (
                            <p className="text-sm text-destructive">
                                No allowed domains. Add a domain first.
                            </p>
                        ) : (
                            <form onSubmit={sendInvite} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select
                                        value={selectedRole ?? undefined}
                                        onValueChange={(v) => setSelectedRole(v as InviteRole)}
                                        disabled={sending}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem key={r.id} value={r.key}>
                                                    {r.displayName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedModule === "GRAPHICS" ? "Graphics users still need project access for specific projects." : "Admin invites cannot assign ADMIN role."}
                                    </p>
                                </div>

                                        <div className="space-y-2">
                                            <Label>Emails (one per line, max 30)</Label>

                                            <Textarea
                                                value={emailsText}
                                                onChange={(e) => setEmailsText(e.target.value)}
                                                placeholder={`user1@domain.com\nuser2@domain.com\nuser3@domain.com`}
                                                disabled={sending}
                                                rows={autoRows(emailsText)}
                                                className="resize-none"
                                            />

                                            <div className="text-xs text-muted-foreground flex items-center justify-between">
                                                <span>{parseEmails(emailsText).length} / 30</span>
                                                {parseEmails(emailsText).length > 30 ? (
                                                    <span className="text-destructive">Too many emails</span>
                                                ) : null}
                                            </div>
                                        </div>
                                        {shouldAssignBuild && (
                                            <>
                                                <br/>
                                                <Label>Select a Build to assign</Label>
                                                <BuildSelect value={buildSel} onChange={setBuildSel} />
                                            </>
                                        )}

                                        <Button type="submit" disabled={!canSend || sending || (shouldAssignBuild && (!buildSel.projectId || !buildSel.envId || !buildSel.versionId))}>
                                            {sending ? "Sending..." : "Send OTP Invites"}
                                        </Button>

                                        {bulkReport && (
                                            <div className="mt-4 rounded-md border p-3 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium">Bulk Invite Report</p>
                                                    <Badge variant="secondary">
                                                        Sent {bulkReport.sent} / {bulkReport.requestedTotal ?? bulkReport.requested}
                                                    </Badge>
                                                </div>

                                                <div className="text-xs text-muted-foreground">
                                                    Mail attempts: <span className="text-foreground">{bulkReport.mailAttempts ?? bulkReport.requested}</span>
                                                    {" "}• Sent: <span className="text-foreground">{bulkReport.sent}</span>
                                                    {" "}• Failed: <span className="text-foreground">{bulkReport.failed}</span>
                                                    {typeof bulkReport.resentExpired === "number" && (
                                                        <>
                                                            {" "}• Expired resent: <span className="text-foreground">{bulkReport.resentExpired}</span>
                                                        </>
                                                    )}
                                                    {typeof bulkReport.blockedAlreadyPending === "number" && (
                                                        <>
                                                            {" "}• Already invited: <span className="text-foreground">{bulkReport.blockedAlreadyPending}</span>
                                                        </>
                                                    )}
                                                    {typeof bulkReport.blockedAlreadyAccepted === "number" && (
                                                        <>
                                                            {" "}• Accepted: <span className="text-foreground">{bulkReport.blockedAlreadyAccepted}</span>
                                                        </>
                                                    )}
                                                    {typeof bulkReport.blockedAlreadyVerified === "number" && (
                                                        <>
                                                            {" "}• Already verified: <span className="text-foreground">{bulkReport.blockedAlreadyVerified}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {bulkReport.blockedAlreadyPendingEmails && bulkReport.blockedAlreadyPendingEmails.length > 0 && (
                                                    <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                                                        <p className="font-medium text-foreground">Skipped active invites</p>
                                                        <p>No email was sent because these users already have pending invites that have not expired.</p>
                                                        <p className="mt-1 break-words">{bulkReport.blockedAlreadyPendingEmails.join(", ")}</p>
                                                    </div>
                                                )}

                                                {bulkReport.resentExpiredEmails && bulkReport.resentExpiredEmails.length > 0 && (
                                                    <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                                                        <p className="font-medium text-foreground">Expired invites resent</p>
                                                        <p>These users had expired invites, so a fresh invite email was sent.</p>
                                                        <p className="mt-1 break-words">{bulkReport.resentExpiredEmails.join(", ")}</p>
                                                    </div>
                                                )}

                                                {bulkReport.blockedAlreadyAcceptedEmails && bulkReport.blockedAlreadyAcceptedEmails.length > 0 && (
                                                    <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                                                        <p className="font-medium text-foreground">Skipped accepted invites</p>
                                                        <p>No email was sent because these invites are already accepted.</p>
                                                        <p className="mt-1 break-words">{bulkReport.blockedAlreadyAcceptedEmails.join(", ")}</p>
                                                    </div>
                                                )}

                                                {bulkReport.blockedAlreadyVerifiedEmails && bulkReport.blockedAlreadyVerifiedEmails.length > 0 && (
                                                    <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                                                        <p className="font-medium text-foreground">Skipped verified users</p>
                                                        <p>No email was sent because these users already have access to this domain.</p>
                                                        <p className="mt-1 break-words">{bulkReport.blockedAlreadyVerifiedEmails.join(", ")}</p>
                                                    </div>
                                                )}

                                                <ScrollArea className="h-40 pr-3">
                                                    {bulkReport.results.length === 0 ? (
                                                        <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                                                            No invite emails were attempted for this batch.
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {bulkReport.results.map((r) => (
                                                                <div key={r.email} className="flex items-start justify-between gap-3 rounded-md border p-2">
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-medium truncate">{r.email}</p>
                                                                        {!r.ok && (
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {r.status ? `Status: ${r.status} ` : ""}
                                                                                {r.message ? `• ${r.message}` : ""}
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    <Badge variant={r.ok ? "secondary" : "outline"}>
                                                                        {r.ok ? "SENT" : "FAILED"}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </ScrollArea>

                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setBulkReport(null)}
                                                    >
                                                        Clear
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
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
                                                        Role - {inv.role ?? "VIEWER"} | Status - {inv.status}
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
