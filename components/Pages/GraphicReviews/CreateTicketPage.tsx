"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, UploadCloud } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";

type Project = { id: number; name: string; slug: string };
type Ticket = { id: number; projectId: number; title: string; description?: string; createdAt: string };

const MOCK_PROJECTS: Project[] = [
    { id: 1, name: "PG&E Substation", slug: "pge-substation" },
    { id: 2, name: "Mosaic Viewer", slug: "mosaic-viewer" },
];

const MOCK_TICKETS: Ticket[] = [
    { id: 101, projectId: 1, title: "Landing page graphics review", description: "Need contrast + alignment review.", createdAt: "2026-04-26" },
    { id: 102, projectId: 1, title: "Icon set refresh", description: "Verify stroke thickness.", createdAt: "2026-04-20" },
    { id: 201, projectId: 2, title: "Poster revisions", description: "Spacing + footer.", createdAt: "2026-04-22" },
];

function CreateTicketDialog({
    projectId,
    onCreate,
}: {
    projectId: number | null;
    onCreate: (t: Ticket) => void;
}) {
    const [open, setOpen] = React.useState(false);
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="icon" disabled={!projectId}>
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create ticket</DialogTitle>
                    <DialogDescription>Create a new ticket under the selected project.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ticket title" />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do reviewers need to check?" rows={4} />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        onClick={() => {
                            if (!projectId) return;
                            const t = title.trim();
                            if (!t) return;

                            const ticket: Ticket = {
                                id: Date.now(),
                                projectId,
                                title: t,
                                description: description.trim() || undefined,
                                createdAt: new Date().toISOString().slice(0, 10),
                            };

                            onCreate(ticket);
                            setTitle("");
                            setDescription("");
                            setOpen(false);
                            toast.success("Ticket created successfully!");
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

function MultiImageDropzone({
    files,
    onChange,
}: {
    files: File[];
    onChange: (files: File[]) => void;
}) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [dragOver, setDragOver] = React.useState(false);

    function accept(list: FileList | null) {
        if (!list || list.length === 0) return;
        const allowed = ["image/png", "image/jpeg", "image/webp"];
        const picked = Array.from(list).filter((f) => allowed.includes(f.type));
        if (picked.length !== list.length) {
            toast.error("Only PNG/JPG/WEBP supported to upload");
        }
        onChange([...files, ...picked]);
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
                accept(e.dataTransfer.files);
            }}
        >
            <CardContent className="p-6 space-y-4">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => accept(e.target.files)}
                />

                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                        <UploadCloud className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">Upload images to this ticket</p>
                            <p className="text-xs text-muted-foreground">
                                Drag & drop multiple images or choose files. (PNG/JPG/WEBP)
                            </p>
                        </div>
                    </div>

                    <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                        Choose files
                    </Button>
                </div>

                {files.length > 0 && (
                    <div className="rounded-md border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Selected ({files.length})</p>
                            <Button type="button" variant="ghost" onClick={() => onChange([])}>
                                Clear
                            </Button>
                        </div>

                        <div className="max-h-40 overflow-auto space-y-2 pr-1">
                            {files.map((f, idx) => (
                                <div key={`${f.name}-${idx}`} className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm truncate">{f.name}</p>
                                        <p className="text-xs text-muted-foreground">{Math.round(f.size / 1024)} KB</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onChange(files.filter((_, i) => i !== idx))}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function CreateTicketPage() {
    const [projects] = React.useState<Project[]>(MOCK_PROJECTS);
    const [tickets, setTickets] = React.useState<Ticket[]>(MOCK_TICKETS);

    const [projectId, setProjectId] = React.useState<number | null>(null);
    const [ticketId, setTicketId] = React.useState<number | null>(null);
    const [files, setFiles] = React.useState<File[]>([]);

    const projectTickets = React.useMemo(
        () => tickets.filter((t) => t.projectId === projectId),
        [tickets, projectId],
    );

    const selectedTicket = React.useMemo(
        () => tickets.find((t) => t.id === ticketId) ?? null,
        [tickets, ticketId],
    );

    const canUpload = projectId && ticketId && files.length > 0;

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Create Ticket</h1>
                <p className="text-sm text-muted-foreground">
                    Select project + ticket and upload multiple graphics into a ticket.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr] items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Ticket details</CardTitle>
                        <CardDescription>Select project and ticket (or create a new one).</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label>Project</Label>
                            <Select
                                value={projectId ? String(projectId) : ""}
                                onValueChange={(v) => {
                                    const id = Number(v);
                                    setProjectId(id);
                                    setTicketId(null);
                                    setFiles([]);
                                }}
                            >
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
                        </div>

                        <div className="space-y-2">
                            <Label>Ticket</Label>
                            <div className="flex gap-2">
                                <Select
                                    value={ticketId ? String(ticketId) : ""}
                                    onValueChange={(v) => {
                                        setTicketId(Number(v));
                                        setFiles([]);
                                    }}
                                    disabled={!projectId}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={projectId ? "Select ticket" : "Select project first"} />
                                    </SelectTrigger>
                                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                        {projectTickets.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <CreateTicketDialog
                                    projectId={projectId}
                                    onCreate={(t) => {
                                        setTickets((prev) => [t, ...prev]);
                                        setTicketId(t.id);
                                    }}
                                />
                            </div>
                        </div>

                        {selectedTicket && (
                            <div className="rounded-md border p-3 space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium">{selectedTicket.title}</p>
                                    <Badge variant="secondary">{selectedTicket.createdAt}</Badge>
                                </div>
                                {selectedTicket.description && (
                                    <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <MultiImageDropzone files={files} onChange={setFiles} />
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1"
                                    disabled={!canUpload}
                                    onClick={() => {
                                        toast.success("Images uploaded into ticket (mock)");
                                        setFiles([]);
                                    }}
                                >
                                    Upload to ticket
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setProjectId(null);
                                        setTicketId(null);
                                        setFiles([]);
                                    }}
                                >
                                    Reset
                                </Button>
                            </div>
                </div>
            </div>
        </div>
    );
}