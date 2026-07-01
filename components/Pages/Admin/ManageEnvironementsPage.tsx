/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { apiFetch } from "@/components/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ProjectCombobox from "./ProjectCombobox";

import { Environment, Project } from "@/types";
import { isNameWithinLimit, isPathSafeSegment, MAX_NAME_LENGTH, nameLengthMessage, pathSafeSegmentMessage } from "@/components/lib/nameValidation";

type EnvDeleteSummary = {
    versions: number;
};

function slugify(input: string) {
    return input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50);
}

export default function ManageEnvironmentsPage() {
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [projectId, setProjectId] = React.useState<number | null>(null);

    const [envs, setEnvs] = React.useState<Environment[]>([]);
    const [loadingEnvs, setLoadingEnvs] = React.useState(false);

    const [name, setName] = React.useState("");
    const [slug, setSlug] = React.useState("");
    const [autoSlug, setAutoSlug] = React.useState(true);
    const [creating, setCreating] = React.useState(false);

    const [search, setSearch] = React.useState("");

    const [deleteEnvId, setDeleteEnvId] = React.useState<number | null>(null);
    const [deleteSummary, setDeleteSummary] = React.useState<EnvDeleteSummary | null>(null);
    const [loadingSummary, setLoadingSummary] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);

    const leftCardRef = React.useRef<HTMLDivElement | null>(null);
    const rightHeaderRef = React.useRef<HTMLDivElement | null>(null);
    const [leftHeight, setLeftHeight] = React.useState<number | null>(null);
    const [rightHeaderHeight, setRightHeaderHeight] = React.useState<number>(0);

    async function loadProjects() {
        const data = await apiFetch<Project[]>("/projects");
        setProjects(Array.isArray(data) ? data : []);
    }

    async function loadEnvs(pid: number) {
        setLoadingEnvs(true);
        try {
            const data = await apiFetch<Environment[]>(`/projects/${pid}/environments`);
            setEnvs(Array.isArray(data) ? data : []);
        } finally {
            setLoadingEnvs(false);
        }
    }

    React.useEffect(() => {
        loadProjects().catch(() => { });
    }, []);

    React.useEffect(() => {
        if (!projectId) {
            setEnvs([]);
            return;
        }
        loadEnvs(projectId).catch(() => { });
    }, [projectId]);

    React.useEffect(() => {
        if (!autoSlug) return;
        setSlug(slugify(name));
    }, [name, autoSlug]);

    React.useEffect(() => {
        const el = leftCardRef.current;
        if (!el) return;

        const update = () => setLeftHeight(el.getBoundingClientRect().height);
        update();

        const ro = new ResizeObserver(() => update());
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    React.useEffect(() => {
        const el = rightHeaderRef.current;
        if (!el) return;

        const update = () => setRightHeaderHeight(el.getBoundingClientRect().height);
        update();

        const ro = new ResizeObserver(() => update());
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return envs;
        return envs.filter(
            (e) => e.name.toLowerCase().includes(q) || e.slug.toLowerCase().includes(q),
        );
    }, [envs, search]);

    const rightCardHeightStyle =
        leftHeight && leftHeight > 0 ? { height: `${leftHeight}px` } : undefined;

    const rightListHeight =
        leftHeight && rightHeaderHeight ? Math.max(120, leftHeight - rightHeaderHeight) : undefined;

    async function createEnvironment(e: React.FormEvent) {
        e.preventDefault();

        if (!projectId) {
            toast.error("Select a project first");
            return;
        }

        const n = name.trim();
        const s = slugify(slug);

        if (n.length < 2) {
            toast.error("Environment name must be at least 2 characters");
            return;
        }
        if (!isNameWithinLimit(name)) {
            toast.error(nameLengthMessage("Environment name"));
            return;
        }
        if (!isPathSafeSegment(slug)) {
            toast.error(pathSafeSegmentMessage("Environment slug"));
            return;
        }
        if (!s) {
            toast.error("Environment slug is required");
            return;
        }

        setCreating(true);
        try {
            await apiFetch(`/projects/${projectId}/environments`, {
                method: "POST",
                body: JSON.stringify({ name: n, slug: s }),
            });

            toast.success("Environment created");
            setName("");
            setSlug("");
            setAutoSlug(true);
            await loadEnvs(projectId);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to create environment");
        } finally {
            setCreating(false);
        }
    }

    async function fetchDeleteSummary(envId: number) {
        setLoadingSummary(true);
        setDeleteSummary(null);
        try {
            const summary = await apiFetch<EnvDeleteSummary>(`/projects/${projectId}/environments/${envId}/summary`);
            setDeleteSummary(summary);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to load delete impact");
        } finally {
            setLoadingSummary(false);
        }
    }

    async function deleteEnvironment(envId: number) {
        setDeleting(true);
        try {
            await apiFetch(`/projects/${projectId}/environments/${envId}`, { method: "DELETE" });
            toast.success("Environment deleted");
            setDeleteEnvId(null);
            setDeleteSummary(null);
            if (projectId) await loadEnvs(projectId);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to delete environment");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="w-full">
            <div className="mb-4 space-y-2">
                <h1 className="text-2xl font-semibold">Environments</h1>
                <p className="text-sm text-muted-foreground">
                    Environments belong to a project (for example: Staging, Prod).
                </p>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
  <Label className="min-w-28">Select project</Label>
  <div className="w-full">
    <ProjectCombobox
      projects={projects}
      value={projectId}
      onChange={(id) => setProjectId(id)}
      disabled={projects.length === 0}
    />
  </div>
</div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
                {/* Left: Create Environment */}
                <div ref={leftCardRef}>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Create Environment</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <form onSubmit={createEnvironment} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Environment name</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Staging"
                                        maxLength={MAX_NAME_LENGTH}
                                        disabled={creating || !projectId}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <Label>Environment slug</Label>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <input
                                                type="checkbox"
                                                checked={autoSlug}
                                                onChange={(e) => setAutoSlug(e.target.checked)}
                                                disabled={creating || !projectId}
                                            />
                                            Auto
                                        </div>
                                    </div>

                                    <Input
                                        value={slug}
                                        onChange={(e) => {
                                            setAutoSlug(false);
                                            setSlug(e.target.value);
                                        }}
                                        placeholder="e.g. qa"
                                        disabled={creating || !projectId}
                                    />
                                    <p className="text-xs text-muted-foreground">Used in URLs and S3 paths.</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button type="submit" disabled={creating || !projectId}>
                                        {creating ? "Creating..." : "Create"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setName("");
                                            setSlug("");
                                            setAutoSlug(true);
                                        }}
                                        disabled={creating || !projectId}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </form>

                            <div className="rounded-md border p-3">
                                <p className="text-sm font-medium">Tips</p>
                                <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground space-y-1">
                                    <li>Use short names like Staging, Prod.</li>
                                    <li>Slugs should be stable and lowercase.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: List Environments (scroll inside, height matches left) */}
                <Card className="flex flex-col" style={rightCardHeightStyle}>
                    <div ref={rightHeaderRef}>
                        <CardHeader className="space-y-3 pb-3">
                            <CardTitle>All Environments</CardTitle>
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or slug..."
                                disabled={!projectId}
                            />
                        </CardHeader>
                    </div>

                    <CardContent className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea
                            className="pr-3"
                            style={rightListHeight ? { height: `${rightListHeight}px` } : undefined}
                        >
                            {!projectId ? (
                                <p className="text-sm text-muted-foreground">Select a project to see environments.</p>
                            ) : loadingEnvs ? (
                                <p className="text-sm text-muted-foreground">Loading environments...</p>
                            ) : filtered.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No environments found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {filtered.map((env) => (
                                        <div key={env.id} className="rounded-lg border p-4">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                        <p className="min-w-0 max-w-full truncate font-medium" title={env.name}>
                                                            {env.name}
                                                        </p>
                                                        <Badge
                                                            variant="secondary"
                                                            className="max-w-full min-w-0 truncate"
                                                            title={env.slug}
                                                        >
                                                            {env.slug}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <AlertDialog
                                                    onOpenChange={(open) => {
                                                        if (open) {
                                                            setDeleteEnvId(env.id);
                                                            fetchDeleteSummary(env.id);
                                                        } else {
                                                            setDeleteEnvId(null);
                                                            setDeleteSummary(null);
                                                        }
                                                    }}
                                                >
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm" className="shrink-0">
                                                            Delete
                                                        </Button>
                                                    </AlertDialogTrigger>

                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete environment?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone.
                                                                {loadingSummary && (
                                                                    <span className="mt-2 block text-sm text-muted-foreground">
                                                                        Loading impact...
                                                                    </span>
                                                                )}

                                                                {!loadingSummary && deleteSummary && deleteEnvId === env.id && (
                                                                    <span className="mt-3 block">
                                                                        <span className="block rounded-md border p-3">
                                                                            <span className="text-sm font-medium block">This will delete</span>
                                                                            <span className="mt-2 flex flex-wrap gap-2">
                                                                                <Badge variant="outline">{deleteSummary.versions} versions</Badge>
                                                                            </span>
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>

                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                disabled={deleting || loadingSummary}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    void deleteEnvironment(env.id);
                                                                }}
                                                            >
                                                                {deleting ? "Deleting..." : "Delete"}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
