"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { UploadCloud, Plus } from "lucide-react";
import { toast } from "sonner";

type Project = { id: number; name: string };
type GraphicName = { id: number; name: string };
type Version = { id: number; name: string };

function CreateValueDialog({
    title,
    placeholder,
    onCreate,
}: {
    title: string;
    placeholder: string;
    onCreate: (name: string) => void;
}) {
    const [open, setOpen] = React.useState(false);
    const [val, setVal] = React.useState("");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="shrink-0">
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Add a new value for this dropdown.</DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder} />
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        onClick={() => {
                            const trimmed = val.trim();
                            if (!trimmed) return;
                            onCreate(trimmed);
                            setVal("");
                            setOpen(false);
                        }}
                    >
                        Create
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function FileDropCard({
    file,
    onChange,
}: {
    file: File | null;
    onChange: (f: File | null) => void;
}) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [dragOver, setDragOver] = React.useState(false);

    function onPick() {
        inputRef.current?.click();
    }

    function acceptFile(f: File) {
        const ok = ["image/png", "image/jpeg", "image/webp"].includes(f.type);
        if (!ok) {
            toast.error("Only PNG, JPG, WEBP supported in this mock page");
            return;
        }
        onChange(f);
    }

    return (
        <Card
            className={[
                "border-dashed transition",
                dragOver ? "border-foreground" : "border-muted-foreground/30",
            ].join(" ")}
            onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) acceptFile(f);
            }}
        >
            <CardContent className="p-6">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        if (f) acceptFile(f);
                    }}
                />

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                            <UploadCloud className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Upload graphic</p>
                            <p className="text-xs text-muted-foreground">
                                Drag & drop an image here or pick a file. (PNG/JPG/WEBP)
                            </p>
                        </div>
                    </div>

                    <Button type="button" variant="outline" onClick={onPick}>
                        Choose file
                    </Button>
                </div>

                {file && (
                    <div className="mt-4 flex items-center justify-between rounded-md border p-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
                        </div>
                        <Button type="button" variant="ghost" onClick={() => onChange(null)}>
                            Remove
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function UploadGraphicPage() {
    // mock dropdown data
    const [projects, setProjects] = React.useState<Project[]>([
        { id: 1, name: "PG&E Substation" },
        { id: 2, name: "Mosaic Viewer" },
    ]);
    const [graphicNames, setGraphicNames] = React.useState<GraphicName[]>([
        { id: 1, name: "Homepage Banner" },
        { id: 2, name: "Safety Poster" },
    ]);
    const [versions, setVersions] = React.useState<Version[]>([
        { id: 1, name: "v1" },
        { id: 2, name: "v2" },
        { id: 3, name: "v3" },
    ]);

    const [projectId, setProjectId] = React.useState<string>("");
    const [graphicNameId, setGraphicNameId] = React.useState<string>("");
    const [versionId, setVersionId] = React.useState<string>("");
    const [description, setDescription] = React.useState("");
    const [file, setFile] = React.useState<File | null>(null);

    const canSubmit = projectId && graphicNameId && versionId && file;

    function reset() {
        setProjectId("");
        setGraphicNameId("");
        setVersionId("");
        setDescription("");
        setFile(null);
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Upload Graphic</h1>
                <p className="text-sm text-muted-foreground">
                    Mock page to demonstrate graphics upload + metadata.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Metadata</CardTitle>
                        <CardDescription>Pick where this graphic belongs.</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5">
                        {/* Project */}
                        <div className="space-y-2">
                            <Label>Project</Label>
                            <div className="flex gap-2">
                                <Select value={projectId} onValueChange={setProjectId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <CreateValueDialog
                                    title="Create Project"
                                    placeholder="Project name"
                                    onCreate={(name) => {
                                        const id = Date.now();
                                        setProjects((prev) => [{ id, name }, ...prev]);
                                        toast.success("Project created (mock)");
                                    }}
                                />
                            </div>
                        </div>

                        {/* Graphic name */}
                        <div className="space-y-2">
                            <Label>Graphic name</Label>
                            <div className="flex gap-2">
                                <Select value={graphicNameId} onValueChange={setGraphicNameId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select graphic name" />
                                    </SelectTrigger>
                                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                        {graphicNames.map((g) => (
                                            <SelectItem key={g.id} value={String(g.id)}>
                                                {g.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <CreateValueDialog
                                    title="Create Graphic Name"
                                    placeholder="e.g. Landing hero"
                                    onCreate={(name) => {
                                        const id = Date.now();
                                        setGraphicNames((prev) => [{ id, name }, ...prev]);
                                        toast.success("Graphic name created (mock)");
                                    }}
                                />
                            </div>
                        </div>

                        {/* Version */}
                        <div className="space-y-2">
                            <Label>Version</Label>
                            <div className="flex gap-2">
                                <Select value={versionId} onValueChange={setVersionId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select version" />
                                    </SelectTrigger>
                                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                        {versions.map((v) => (
                                            <SelectItem key={v.id} value={String(v.id)}>
                                                {v.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <CreateValueDialog
                                    title="Create Version"
                                    placeholder="v4"
                                    onCreate={(name) => {
                                        const id = Date.now();
                                        setVersions((prev) => [{ id, name }, ...prev]);
                                        toast.success("Version created (mock)");
                                    }}
                                />
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Version helps reviewers comment against a specific revision.
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What changed in this version? What should reviewers focus on?"
                                rows={4}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <FileDropCard file={file} onChange={setFile} />

                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Preview</p>
                                {versionId ? <Badge variant="secondary">v{versionId}</Badge> : <Badge variant="outline">No version</Badge>}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                This is a mock page. On real implementation, you’ll upload to S3 and persist metadata.
                            </p>

                            <div className="flex gap-2">
                                <Button
                                    className="flex-1"
                                    disabled={!canSubmit}
                                    onClick={() => {
                                        toast.success("Uploaded (mock)");
                                        reset();
                                    }}
                                >
                                    Upload
                                </Button>
                                <Button variant="outline" onClick={reset}>
                                    Reset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}