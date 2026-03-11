/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { apiFetch } from "@/components/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type AllowedDomain = {
    id: number;
    domain: string;
    createdAt: string;
};

type DomainSummary = {
    userCount: number;
    inviteCount: number;
};

function normalizeDomain(input: string) {
    let d = input.trim().toLowerCase();
    d = d.replace(/^@/, "");
    d = d.replace(/^https?:\/\//, "");
    d = d.split("/")[0];
    return d;
}

function isValidDomain(d: string) {
    if (!d) return false;
    if (d.includes(" ")) return false;
    if (!d.includes(".")) return false;
    if (d.startsWith(".") || d.endsWith(".")) return false;
    return true;
}

export default function ManageEmailDomainsPage() {
    const [domains, setDomains] = React.useState<AllowedDomain[]>([]);
    const [loading, setLoading] = React.useState(true);

    const [domainInput, setDomainInput] = React.useState("");
    const [adding, setAdding] = React.useState(false);
    const [search, setSearch] = React.useState("");

    // Delete dialog state
    const [deleteUsers, setDeleteUsers] = React.useState(false);
    const [summary, setSummary] = React.useState<DomainSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);
    const [activeDomain, setActiveDomain] = React.useState<AllowedDomain | null>(null);

    async function loadDomains() {
        setLoading(true);
        try {
            const data = await apiFetch<AllowedDomain[]>("/api/admin/allowed-domains");
            setDomains(Array.isArray(data) ? data : []);
        } catch (e: any) {
            toast.error(e?.message ?? "Failed to load domains");
            setDomains([]);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        loadDomains();
    }, []);

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return domains;
        return domains.filter((d) => d.domain.includes(q));
    }, [domains, search]);

    async function addDomain(e: React.FormEvent) {
        e.preventDefault();

        const d = normalizeDomain(domainInput);
        if (!isValidDomain(d)) {
            toast.error("Enter a valid domain (example: themosaiccompany.com)");
            return;
        }

        setAdding(true);
        try {
            await apiFetch("/api/admin/allowed-domains", {
                method: "POST",
                body: JSON.stringify({ domain: d }),
            });
            toast.success("Domain added");
            setDomainInput("");
            await loadDomains();
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to add domain");
        } finally {
            setAdding(false);
        }
    }

    async function loadSummary(domainId: number) {
        setSummaryLoading(true);
        setSummary(null);
        try {
            const data = await apiFetch<DomainSummary>(
                `/api/admin/allowed-domains/${domainId}/summary`,
                { method: "GET" },
            );
            setSummary(data);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to load impact");
        } finally {
            setSummaryLoading(false);
        }
    }

    async function deleteDomain(domainId: number, withUsers: boolean) {
        setDeleting(true);
        try {
            const qs = withUsers ? "?deleteUsers=true" : "";
            await apiFetch(`/api/admin/allowed-domains/${domainId}${qs}`, {
                method: "DELETE",
            });
            toast.success(withUsers ? "Domain and VIEWERS deleted" : "Domain deleted, no VIEWERS got deleted");
            await loadDomains();
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to delete domain");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="w-full max-w-4xl">
            <div className="mb-4">
                <h1 className="text-2xl font-semibold">Allowed Email Domains</h1>
                <p className="text-sm text-muted-foreground">
                    Only users from these domains can use OTP login and be invited.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
                {/* Left */}
                <Card className="self-start">
                    <CardHeader className="pb-3">
                        <CardTitle>Add Domain</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={addDomain} className="space-y-3">
                            <div className="space-y-2">
                                <Label>Domain</Label>
                                <Input
                                    value={domainInput}
                                    onChange={(e) => setDomainInput(e.target.value)}
                                    placeholder="themosaiccompany.com"
                                    disabled={adding}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Add only the domain part. Example: themosaiccompany.com
                                </p>
                            </div>
                            <Button type="submit" disabled={adding}>
                                {adding ? "Adding..." : "Add Domain"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Right */}
                <Card className="flex flex-col">
                    <CardHeader className="space-y-3 pb-3">
                        <CardTitle>All Domains</CardTitle>
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search domains..."
                        />
                    </CardHeader>

                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Domains</p>
                            <Badge variant="secondary">{domains.length}</Badge>
                        </div>

                        {loading ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No domains found.</p>
                        ) : (
                            <div className="space-y-2">
                                {filtered.map((d) => (
                                    <div
                                        key={d.id}
                                        className="flex items-center justify-between rounded-md border p-3"
                                    >
                                        <span className="text-sm font-medium">{d.domain}</span>

                                        <AlertDialog
                                            onOpenChange={(open) => {
                                                if (open) {
                                                    setActiveDomain(d);
                                                    setDeleteUsers(false);
                                                    setSummary(null);
                                                    setSummaryLoading(false);
                                                } else {
                                                    setActiveDomain(null);
                                                    setSummary(null);
                                                    setDeleteUsers(false);
                                                }
                                            }}
                                        >
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm">
                                                    Delete
                                                </Button>
                                            </AlertDialogTrigger>

                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete domain?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        <span className="block">
                                                            This will remove <span className="font-medium">{d.domain}</span> from allowed domains.
                                                        </span>

                                                        <span className="mt-2 block text-sm text-muted-foreground">
                                                            This only affects future OTP logins and future invites for this domain.
                                                        </span>

                                                        <span className="mt-3 block rounded-md border p-3">
                                                            <label className="flex items-start gap-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={deleteUsers}
                                                                    disabled={deleting}
                                                                    onChange={(e) => {
                                                                        const checked = e.target.checked;
                                                                        setDeleteUsers(checked);

                                                                        // Lazy-load impact only if admin chooses destructive delete
                                                                        if (
                                                                            checked &&
                                                                            activeDomain?.id === d.id &&
                                                                            !summaryLoading &&
                                                                            !summary
                                                                        ) {
                                                                            loadSummary(d.id);
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="text-sm">
                                                                    Also delete all users whose email ends with{" "}
                                                                    <span className="font-medium">@{d.domain}</span>
                                                                </span>
                                                            </label>

                                                            <span className="mt-2 block text-xs text-muted-foreground">
                                                                This will remove user accounts, their refresh tokens and their access
                                                            </span>

                                                            {/* Show impact only when checkbox is checked */}
                                                            {deleteUsers && (
                                                                <>
                                                                    {summaryLoading && (
                                                                        <span className="mt-2 block text-sm text-muted-foreground">
                                                                            Loading impact...
                                                                        </span>
                                                                    )}

                                                                    {!summaryLoading && summary && activeDomain?.id === d.id && (
                                                                        <span className="mt-3 block rounded-md border p-3">
                                                                            <span className="block text-sm font-medium">Impact</span>
                                                                            <span className="mt-2 flex flex-wrap gap-2">
                                                                                <Badge variant="outline">{summary.userCount}
                                                                                    {summary.userCount === 1 ? "VIEWER" : " VIEWERS"}</Badge>
                                                                                <Badge variant="outline">{summary.inviteCount}
                                                                                    {summary.inviteCount === 1 ? " INVITE" : " INVITES"}</Badge>
                                                                            </span>
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </span>
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>

                                                <AlertDialogFooter>
                                                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        disabled={deleting || summaryLoading}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            void deleteDomain(d.id, deleteUsers);
                                                        }}
                                                    >
                                                        {deleting ? "Deleting..." : "Delete"}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}