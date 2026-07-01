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
import {  Project } from "@/types";
import { isPathSafeSegment, pathSafeSegmentMessage } from "@/components/lib/nameValidation";

type ProjectDeleteSummary = {
    environments: number;
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

export default function ManageProjectsPage() {
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = React.useState(true);

    const [name, setName] = React.useState("");
    const [slug, setSlug] = React.useState("");
    const [autoSlug, setAutoSlug] = React.useState(true);
    const [creating, setCreating] = React.useState(false);

    const [search, setSearch] = React.useState("");

    const [deleteProjectId, setDeleteProjectId] = React.useState<number | null>(null);
    const [deleteSummary, setDeleteSummary] = React.useState<ProjectDeleteSummary | null>(null);
    const [loadingSummary, setLoadingSummary] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);

    async function loadProjects() {
        setLoadingProjects(true);
        try {
            const data = await apiFetch<Project[]>("/projects");
            setProjects(Array.isArray(data) ? data : []);
        } finally {
            setLoadingProjects(false);
        }
    }

    React.useEffect(() => {
        loadProjects();
    }, []);

    React.useEffect(() => {
        if (!autoSlug) return;
        setSlug(slugify(name));
    }, [name, autoSlug]);

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return projects;
        return projects.filter(
            (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
        );
    }, [projects, search]);

    async function createProject(e: React.FormEvent) {
        e.preventDefault();

        const n = name.trim();
        const s = slugify(slug);

        if (n.length < 2) {
            toast.error("Project name must be at least 2 characters");
            return;
        }
        if (!isPathSafeSegment(slug)) {
            toast.error(pathSafeSegmentMessage("Project slug"));
            return;
        }
        if (!s) {
            toast.error("Project slug is required");
            return;
        }

        setCreating(true);
        try {
            await apiFetch("/projects", {
                method: "POST",
                body: JSON.stringify({ name: n, slug: s }),
            });

            toast.success("Project created");
            setName("");
            setSlug("");
            setAutoSlug(true);
            await loadProjects();
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to create project");
        } finally {
            setCreating(false);
        }
    }

    async function fetchDeleteSummary(projectId: number) {
        setLoadingSummary(true);
        setDeleteSummary(null);
        try {
            const summary = await apiFetch<ProjectDeleteSummary>(`/projects/${projectId}/summary`);
            setDeleteSummary(summary);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to load delete summary");
        } finally {
            setLoadingSummary(false);
        }
    }

    async function deleteProject(projectId: number) {
        setDeleting(true);
        try {
            await apiFetch(`/projects/${projectId}`, { method: "DELETE" });
            toast.success("Project deleted");
            setDeleteProjectId(null);
            setDeleteSummary(null);
            await loadProjects();
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to delete project");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="w-full">
            <div className="mb-4">
                <h1 className="text-2xl font-semibold">Projects</h1>
                <p className="text-sm text-muted-foreground">
                    Create projects and manage existing ones. Deleting a project removes its environments and versions.
                </p>
            </div>

            {/* items-stretch makes both cards same height (row height driven by left card content) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
                {/* Left: Create Project (fit content, reduced bottom space) */}
                <Card className="self-start">
                    <CardHeader className="pb-3">
                        <CardTitle>Create Project</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <form onSubmit={createProject} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Project name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. PGE Transmission"
                                    disabled={creating}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <Label>Project slug</Label>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <input
                                            type="checkbox"
                                            checked={autoSlug}
                                            onChange={(e) => setAutoSlug(e.target.checked)}
                                            disabled={creating}
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
                                    placeholder="e.g. pge-transmission"
                                    disabled={creating}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Used in URLs and S3 paths.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button type="submit" disabled={creating}>
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
                                    disabled={creating}
                                >
                                    Reset
                                </Button>
                            </div>
                        </form>

                        {/* Compact tips (less space than before) */}
                        <div className="rounded-md border p-3">
                            <p className="text-sm font-medium">Tips</p>
                            <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground space-y-1">
                                <li>Keep slugs stable (changing breaks URLs).</li>
                                <li>Use envs for Staging/Prod, versions for releases.</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: same height as left, list scrolls inside */}
                <Card className="flex flex-col h-full">
                    <CardHeader className="space-y-3 pb-3">
                        <CardTitle>All Projects</CardTitle>
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or slug..."
                        />
                    </CardHeader>

                    {/* This area stretches and becomes scroll container */}
                    <CardContent className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="h-full pr-3">
                            {loadingProjects ? (
                                <p className="text-sm text-muted-foreground">Loading projects...</p>
                            ) : filtered.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No projects found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {filtered.map((p) => (
                                        <div key={p.id} className="rounded-lg border p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{p.name}</p>
                                                        <Badge variant="secondary">{p.slug}</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">ID {p.id}</p>
                                                </div>

                                                <AlertDialog
                                                    onOpenChange={(open) => {
                                                        if (open) {
                                                            setDeleteProjectId(p.id);
                                                            fetchDeleteSummary(p.id);
                                                        } else {
                                                            setDeleteProjectId(null);
                                                            setDeleteSummary(null);
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
                                                            <AlertDialogTitle>Delete project?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone.
                                                                {loadingSummary && (
                                                                    <span className="mt-2 block text-sm text-muted-foreground">
                                                                        Loading impact...
                                                                    </span>
                                                                )}
                                                                {!loadingSummary && deleteSummary && deleteProjectId === p.id && (
                                                                    <span className="mt-3 block">
                                                                        <span className="block rounded-md border p-3">
                                                                            <span className="text-sm font-medium block">This will delete</span>
                                                                            <span className="mt-2 flex flex-wrap gap-2">
                                                                                <Badge variant="outline">{deleteSummary.environments} environments</Badge>
                                                                                <Badge variant="outline">{deleteSummary.versions} versions</Badge>
                                                                            </span>
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>

                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel disabled={deleting}>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                disabled={deleting || loadingSummary}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    void deleteProject(p.id);
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
