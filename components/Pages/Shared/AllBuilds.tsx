/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, getApiBase } from "@/components/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";
import { Users, Check, ChevronsUpDown, X } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/useAuth";

type Uploader = { name?: string | null; email: string };

type BuildRow = {
    id: number; // version id
    name: string; // version name
    isActive: boolean;
    s3Path: string;
    releaseNotes?: string | null;
    releaseNotesUpdatedAt?: string | null;
    lastUploadedAt?: string | null;
    lastUploadedByUser?: Uploader | null;
    environment: {
        id: number;
        name: string;
        slug: string;
        project: {
            id: number;
            name: string;
            slug: string;
        };
    };
};

type UserRow = {
    id: number;
    email: string;
    name?: string | null;
    role: string;
};


function getTimeZoneInfo() {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const parts = new Intl.DateTimeFormat(undefined, {
            timeZone: tz,
            timeZoneName: "shortOffset",
        }).formatToParts(new Date());

        const offset = parts.find((p) => p.type === "timeZoneName")?.value || tz;
        return { tz, offset };
    } catch {
        return { tz: "UTC", offset: "UTC" };
    }
}

function formatLocalDateTime(iso?: string | null) {
    if (!iso) return "Not available";
    try {
        const { tz, offset } = getTimeZoneInfo();
        const d = new Date(iso);
        const formatted = new Intl.DateTimeFormat(undefined, {
            timeZone: tz,
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }).format(d);
        return `${formatted} (${offset})`;
    } catch {
        return iso;
    }
}

export default function AllBuilds() {
    const [rows, setRows] = useState<BuildRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [projectFilter, setProjectFilter] = useState<string>("ALL");
    const [envFilter, setEnvFilter] = useState<string>("ALL");
    const [sort, setSort] = useState<"NEWEST" | "OLDEST">("NEWEST");

    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [bulkResult, setBulkResult] = useState<any>(null);
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignVersion, setAssignVersion] = useState<BuildRow | null>(null);

    const [users, setUsers] = useState<UserRow[]>([]);
    const [usersLoaded, setUsersLoaded] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);

    const [userPickerOpen, setUserPickerOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [assigning, setAssigning] = useState(false);

    const {me}= useAuth()
    useEffect(() => {
        loadAll();
    }, []);

    async function loadAll() {
        try {
            setLoading(true);
            setErr(null);

            const data = await apiFetch<BuildRow[]>("/api/builds/all", { method: "GET" });
            if (!Array.isArray(data)) throw new Error("Invalid response");

            setRows(data);
        } catch (e: any) {
            setErr(e?.message ?? "Failed to load builds");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    async function loadUsersOnce() {
        if (usersLoaded || usersLoading) return;
        try {
            setUsersLoading(true);
            const data = await apiFetch<UserRow[]>("/api/admin/users", { method: "GET" });
            const list = Array.isArray(data) ? data : [];

            // Recommended: only allow assigning builds to VIEWER users
            const viewersOnly = list.filter((u) => u.role === "VIEWER");

            setUsers(viewersOnly);
            setUsersLoaded(true);
        } catch (e: any) {
            toast.error(e?.message ?? "Failed to load users");
            setUsers([]);
        } finally {
            setUsersLoading(false);
        }
    }

    async function copy(url: string, id: number) {
        await navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    const projects = useMemo(() => {
        const map = new Map<string, string>();
        rows.forEach((r) => map.set(r.environment.project.slug, r.environment.project.name));
        return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
    }, [rows]);

    const envs = useMemo(() => {
        const map = new Map<string, string>();
        rows.forEach((r) => {
            if (projectFilter !== "ALL" && r.environment.project.slug !== projectFilter) return;
            map.set(r.environment.slug, r.environment.name);
        });
        return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
    }, [rows, projectFilter]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        let list = rows.filter((r) => {
            if (projectFilter !== "ALL" && r.environment.project.slug !== projectFilter) return false;
            if (envFilter !== "ALL" && r.environment.slug !== envFilter) return false;

            if (!q) return true;

            const hay = [
                r.environment.project.name,
                r.environment.project.slug,
                r.environment.name,
                r.environment.slug,
                r.name,
                r.s3Path,
            ]
                .join(" ")
                .toLowerCase();

            return hay.includes(q);
        });

        list = list.sort((a, b) => {
            const aTime = new Date(a.lastUploadedAt || a.releaseNotesUpdatedAt || 0).getTime() || 0;
            const bTime = new Date(b.lastUploadedAt || b.releaseNotesUpdatedAt || 0).getTime() || 0;
            if (sort === "NEWEST") return bTime - aTime;
            return aTime - bTime;
        });

        return list;
    }, [rows, search, projectFilter, envFilter, sort]);

    function openAssignDialog(version: BuildRow) {
        setAssignVersion(version);
        setSelectedUserIds([]);
        setAssignOpen(true);
        void loadUsersOnce();
    }

    function toggleUser(id: number) {
        setSelectedUserIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }

    function removeSelected(id: number) {
        setSelectedUserIds((prev) => prev.filter((x) => x !== id));
    }

    async function assignToUsers() {
        if (!assignVersion) return;
        if (selectedUserIds.length === 0) {
            toast.error("Select at least one user");
            return;
        }

        try {
            setAssigning(true);

            const res = await apiFetch("/api/admin/viewer-access/bulk", {
                method: "POST",
                body: JSON.stringify({ versionId: assignVersion.id, userIds: selectedUserIds }),
            });

            setBulkResult(res);

            //setAssignOpen(false);
            setAssignVersion(null);
            setSelectedUserIds([]);
        } catch (e: any) {
            toast.error(e?.message ?? "Failed to assign access");
        } finally {
            setAssigning(false);
        }
    }

    const selectedUsersPreview = useMemo(() => {
        const map = new Map<number, UserRow>();
        users.forEach((u) => map.set(u.id, u));
        return selectedUserIds.map((id) => map.get(id)).filter(Boolean) as UserRow[];
    }, [users, selectedUserIds]);

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold">All Builds</h1>
                <p className="text-sm text-muted-foreground">
                    Browse and test all uploaded builds across projects, environments, and versions.
                </p>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="md:col-span-2">
                            <Input
                                placeholder="Search project, env, version..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <Select
                            value={projectFilter}
                            onValueChange={(v) => {
                                setProjectFilter(v);
                                setEnvFilter("ALL");
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Project" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                                <SelectItem value="ALL">All Projects</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.slug} value={p.slug}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={envFilter} onValueChange={(v) => setEnvFilter(v)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Environment" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                                <SelectItem value="ALL">All Environments</SelectItem>
                                {envs.map((e) => (
                                    <SelectItem key={e.slug} value={e.slug}>
                                        {e.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">Sort</Label>
                            <Select value={sort} onValueChange={(v: any) => setSort(v)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NEWEST">Newest</SelectItem>
                                    <SelectItem value="OLDEST">Oldest</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-foreground">{filtered.length}</span> builds
                        </div>
                    </div>
                </CardContent>
            </Card>

            {err && <p className="text-sm text-destructive">{err}</p>}

            {loading ? (
                <p className="text-sm text-muted-foreground">Loading builds...</p>
            ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">No builds found.</p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((r) => {
                        const project = r.environment.project.name;
                        const projectSlug = r.environment.project.slug;
                        const env = r.environment.name;
                        const envSlug = r.environment.slug;
                        const version = r.name;

                        const publicUrl = `/public/${projectSlug}/${envSlug}/${version}`;
                        const backendUrl = `${getApiBase()}${publicUrl}`;

                        const uploadedAt = formatLocalDateTime(r.lastUploadedAt || r.releaseNotesUpdatedAt);
                        const uploadedBy =
                            r.lastUploadedByUser?.name?.trim() || r.lastUploadedByUser?.email || "Not available";

                        const notes = (r.releaseNotes || "").trim() || "No release notes provided.";

                        return (
                            <Card key={r.id} className="flex flex-col justify-between hover:shadow-lg transition">
                                <CardHeader className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-base font-sans font-normal">{project}</CardTitle>
                                {(me?.role === "ADMIN" || me?.role === "MANAGER") && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => openAssignDialog(r)}
                                            title="Assign this build to users"
                                        >
                                            <Users className="h-4 w-4" />
                                        </Button>
                                )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <Badge variant="secondary" className="font-sans font-normal">{env}</Badge>
                                        <Badge variant="outline" className="font-sans font-normal">{version}</Badge>
                                    </div>

                                    
                                </CardHeader>

                                <CardContent className="space-y-3">
                                    <div className="flex flex-col gap-2">
                                        <Button className="w-full" onClick={() => window.open(backendUrl, "_blank")}>
                                            Open Build
                                        </Button>

                                        <Button variant="outline" className="w-full" onClick={() => copy(backendUrl, r.id)}>
                                            {copiedId === r.id ? "Copied!" : "Copy URL"}
                                        </Button>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="secondary" className="w-full">
                                                    Release Notes
                                                </Button>
                                            </DialogTrigger>

                                            <DialogContent className="max-w-lg">
                                                <DialogHeader>
                                                    <DialogTitle>Release Notes</DialogTitle>
                                                    <div className="text-xs text-muted-foreground pt-1 space-y-1">
                                                        <div>
                                                            Uploaded on: <span className="text-foreground">{uploadedAt}</span>
                                                        </div>
                                                        <div>
                                                            Uploaded by: <span className="text-foreground">{uploadedBy}</span>
                                                        </div>
                                                    </div>
                                                </DialogHeader>

                                                <ScrollArea className="max-h-[420px] pr-3">
                                                    <div className="whitespace-pre-wrap text-md text-muted-foreground">
                                                        {notes}
                                                    </div>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Assign dialog */}
            <Dialog open={assignOpen} onOpenChange={(v) => { setAssignOpen(v); if (!v) setUserPickerOpen(false); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Assign Build Access</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Select users to grant access to this build.
                        </p>
                    </DialogHeader>

                    <div className="space-y-3">
                        {assignVersion ? (
                            <div className="rounded-md border p-3 text-sm">
                                <div className="font-medium">
                                    {assignVersion.environment.project.name}
                                </div>
                                <div className="text-muted-foreground text-xs mt-1">
                                    {assignVersion.environment.name} • {assignVersion.name}
                                </div>
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            <Label>Select users</Label>

                            <Popover open={userPickerOpen} onOpenChange={setUserPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between"
                                        disabled={usersLoading}
                                    >
                                        {usersLoading
                                            ? "Loading users..."
                                            : selectedUserIds.length > 0
                                                ? `${selectedUserIds.length} selected`
                                                : "Select users"}
                                        <ChevronsUpDown className="h-4 w-4 opacity-60" />
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                                    <Command>
                                        <CommandInput placeholder="Search users..." />
                                        <CommandEmpty>No users found.</CommandEmpty>

                                        <CommandGroup>
                                            {users.map((u) => {
                                                const label = u.name?.trim() ? `${u.name} (${u.email})` : u.email;
                                                const checked = selectedUserIds.includes(u.id);

                                                return (
                                                    <CommandItem
                                                        key={u.id}
                                                        value={label}
                                                        onSelect={() => toggleUser(u.id)}
                                                    >
                                                        <Check className={`mr-2 h-4 w-4 ${checked ? "opacity-100" : "opacity-0"}`} />
                                                        <span className="text-sm">{label}</span>
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {selectedUsersPreview.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {selectedUsersPreview.map((u) => {
                                        const label = u.name?.trim() ? u.name : u.email;
                                        return (
                                            <span
                                                key={u.id}
                                                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                                            >
                                                {label}
                                                <button
                                                    type="button"
                                                    className="text-muted-foreground hover:text-foreground"
                                                    onClick={() => removeSelected(u.id)}
                                                    title="Remove"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Only viewer users are shown here.
                                </p>
                            )}
                        </div>
                        {bulkResult ? (
                            <div className="mt-3 rounded-md border p-3 space-y-2">
                                <div className="text-sm font-medium">Assignment Results</div>
                                <div className="text-xs text-muted-foreground">
                                    Requested: {bulkResult.summary.requested} • Assigned: {bulkResult.summary.assigned} • Already:{" "}
                                    {bulkResult.summary.alreadyAssigned} • Not viewer: {bulkResult.summary.notViewer} • Invalid:{" "}
                                    {bulkResult.summary.invalidUsers}
                                </div>

                                <ScrollArea className="max-h-48 pr-3">
                                    <div className="space-y-1">
                                        {bulkResult.results.map((r: any) => (
                                            <div key={`${r.userId}-${r.status}`} className="flex items-center justify-between text-xs">
                                                <div className="truncate">
                                                    {r.name ? `${r.name} (${r.email})` : r.email || `UserId: ${r.userId}`}
                                                </div>
                                                <Badge variant="outline" className="ml-2">
                                                    {r.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        ) : null}
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setBulkResult(null);
                                    setSelectedUserIds([]);
                                setAssignOpen(false)}}
                                disabled={assigning}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={assignToUsers}
                                disabled={assigning || !assignVersion || selectedUserIds.length === 0}
                            >
                                {assigning ? "Assigning..." : "Assign Access"}
                            </Button>
                        </div>

                        
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}