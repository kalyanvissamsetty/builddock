/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ArrowDownToLine, FolderPlus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/components/lib/api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";

type Project = {
    id: number;
    name: string;
    slug: string;
    createdAt?: string;
    graphicData?: { id: number } | null;
    webglData?: { id: number } | null;
};

function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50);
}

function sortProjects(projects: Project[]) {
    return projects.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export default function GraphicProjectsPage() {
    const [allProjects, setAllProjects] = React.useState<Project[]>([]);
    const [graphicProjects, setGraphicProjects] = React.useState<Project[]>([]);
    const [loading, setLoading] = React.useState(true);

    const [name, setName] = React.useState("");
    const [slug, setSlug] = React.useState("");
    const [autoSlug, setAutoSlug] = React.useState(true);
    const [creating, setCreating] = React.useState(false);

    const [selectedImportId, setSelectedImportId] = React.useState<string>("");
    const [importing, setImporting] = React.useState(false);
    const [deleteProject, setDeleteProject] = React.useState<Project | null>(null);
    const [deleting, setDeleting] = React.useState(false);

    React.useEffect(() => {
        if (!autoSlug) return;
        setSlug(slugify(name));
    }, [autoSlug, name]);

    async function loadProjects() {
        setLoading(true);
        try {
            const [graphicsResult, allProjectsResult] = await Promise.allSettled([
                apiFetch<Project[]>("/api/graphics/projects"),
                apiFetch<Project[]>("/api/graphics/projects/import-candidates"),
            ]);

            if (graphicsResult.status === "rejected") {
                throw graphicsResult.reason;
            }

            const graphics = Array.isArray(graphicsResult.value) ? sortProjects(graphicsResult.value) : [];
            setGraphicProjects(graphics);

            if (allProjectsResult.status === "fulfilled" && Array.isArray(allProjectsResult.value)) {
                setAllProjects(sortProjects(allProjectsResult.value));
            } else {
                setAllProjects([]);
            }
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to load projects");
            setAllProjects([]);
            setGraphicProjects([]);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        loadProjects();
    }, []);

    const graphicProjectIds = React.useMemo(
        () => new Set(graphicProjects.map((project) => project.id)),
        [graphicProjects],
    );

    const importCandidates = React.useMemo(
        () => allProjects.filter((project) => !graphicProjectIds.has(project.id)),
        [allProjects, graphicProjectIds],
    );
    const selectedImportProject = React.useMemo(
        () => importCandidates.find((project) => String(project.id) === selectedImportId) ?? null,
        [importCandidates, selectedImportId],
    );

    async function createGraphicProject(event: React.FormEvent) {
        event.preventDefault();

        const projectName = name.trim();
        const projectSlug = slugify(slug);

        if (projectName.length < 2) {
            toast.error("Project name must be at least 2 characters");
            return;
        }
        if (!projectSlug) {
            toast.error("Project slug is required");
            return;
        }

        setCreating(true);
        try {
            const created = await apiFetch<Project>("/api/graphics/projects", {
                method: "POST",
                body: JSON.stringify({ name: projectName, slug: projectSlug }),
            });

            setName("");
            setSlug("");
            setAutoSlug(true);
            setGraphicProjects((current) => sortProjects([created, ...current]));
            setAllProjects((current) => sortProjects([created, ...current]));
            toast.success("Graphics project created");
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to create graphics project");
        } finally {
            setCreating(false);
        }
    }

    async function importExistingProject() {
        const projectId = Number(selectedImportId);
        if (!projectId) return;

        setImporting(true);
        try {
            const imported = await apiFetch<Project>("/api/graphics/projects/import", {
                method: "POST",
                body: JSON.stringify({ projectId }),
            });

            setSelectedImportId("");
            setGraphicProjects((current) => sortProjects([imported, ...current.filter((p) => p.id !== imported.id)]));
            setAllProjects((current) => current.map((project) => (project.id === imported.id ? imported : project)));
            toast.success("Project imported to Graphics");
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to import project");
        } finally {
            setImporting(false);
        }
    }

    async function confirmDeleteProject() {
        if (!deleteProject) return;

        setDeleting(true);
        try {
            await apiFetch(`/api/graphics/projects/${deleteProject.id}`, {
                method: "DELETE",
            });

            setGraphicProjects((current) => current.filter((project) => project.id !== deleteProject.id));
            setAllProjects((current) => (
                deleteProject.webglData
                    ? sortProjects([...current, { ...deleteProject, graphicData: null }])
                    : current.filter((project) => project.id !== deleteProject.id)
            ));
            toast.success("Graphics project deleted");
            setDeleteProject(null);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to delete graphics project");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="w-full space-y-10">
            <div className="flex flex-col gap-3  pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Graphics Projects</h1>
                </div>
                <Button variant="outline" onClick={loadProjects} disabled={loading} className="w-fit gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <div className="grid py-10 gap-8 lg:grid-cols-2 ">
                <Card className="h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <FolderPlus className="h-5 w-5" />
                                Create Project
                            </CardTitle>
                            <CardDescription>Use this for a project that starts in Graphics.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={createGraphicProject} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Project name</Label>
                                        <Input
                                            value={name}
                                            onChange={(event) => setName(event.target.value)}
                                            placeholder="e.g. Training poster set"
                                            disabled={creating}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <Label>Project slug</Label>
                                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <input
                                                    type="checkbox"
                                                    checked={autoSlug}
                                                    onChange={(event) => setAutoSlug(event.target.checked)}
                                                    disabled={creating}
                                                />
                                                Auto
                                            </label>
                                        </div>
                                        <Input
                                            value={slug}
                                            onChange={(event) => {
                                                setAutoSlug(false);
                                                setSlug(event.target.value);
                                            }}
                                            placeholder="training-poster-set"
                                            disabled={creating}
                                        />
                                    </div>
                                </div>

                                <Button type="submit" disabled={creating} className="w-fit gap-2">
                                    <FolderPlus className="h-4 w-4" />
                                    {creating ? "Creating..." : "Create Graphics Project"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <ArrowDownToLine className="h-5 w-5" />
                                Import Existing Project
                            </CardTitle>
                            <CardDescription>Use this when a WebGL project should also have Graphics tickets.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                                <Combobox
                                    items={importCandidates}
                                    value={selectedImportProject}
                                    onValueChange={(project) => setSelectedImportId(project ? String(project.id) : "")}
                                    itemToStringLabel={(project) => project.name}
                                >
                                    <ComboboxInput
                                        placeholder={loading ? "Loading projects..." : "Search project to import"}
                                        disabled={loading || importing}
                                        showClear
                                        className="w-full"
                                    />
                                    <ComboboxContent>
                                        <ComboboxEmpty>No project found.</ComboboxEmpty>
                                        <ComboboxList>
                                            {(project) => (
                                                <ComboboxItem key={project.id} value={project}>
                                                    <div className="min-w-0">
                                                        <p className="truncate">{project.name}</p>
                                                        <p className="truncate text-xs text-muted-foreground">{project.slug}</p>
                                                    </div>
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={importExistingProject}
                                    disabled={!selectedImportId || importing}
                                    className="w-fit gap-2 justify-self-start sm:justify-self-end"
                                >
                                    <ArrowDownToLine className="h-4 w-4" />
                                    {importing ? "Importing..." : "Import"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
            </div>

                <Card className="min-h-[460px]">
                    <CardHeader className="pb-3">
                        <CardTitle>Graphics Project List</CardTitle>
                        <CardDescription>{graphicProjects.length} projects available for tickets and access control.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[360px] pr-3">
                            {loading ? (
                                <p className="text-sm text-muted-foreground">Loading projects...</p>
                            ) : graphicProjects.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No graphics projects yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {graphicProjects.map((project) => (
                                        <div key={project.id} className="rounded-md border p-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="font-medium">{project.name}</p>
                                                    <p className="text-xs text-muted-foreground">{project.slug}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {project.webglData && <Badge variant="outline">WebGL</Badge>}
                                                    <Badge variant="secondary">Graphics</Badge>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        aria-label={`Delete ${project.name}`}
                                                        onClick={() => setDeleteProject(project)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            <AlertDialog open={Boolean(deleteProject)} onOpenChange={(open) => !open && !deleting && setDeleteProject(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Graphics project?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete all Graphics tickets, uploaded graphics, versions, comments, and project access for{" "}
                            <span className="font-medium text-foreground">{deleteProject?.name}</span>. If this project also exists in WebGL,
                            its WebGL environments, builds, and assignments will remain untouched.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                confirmDeleteProject();
                            }}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? "Deleting..." : "Delete Graphics Project"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
