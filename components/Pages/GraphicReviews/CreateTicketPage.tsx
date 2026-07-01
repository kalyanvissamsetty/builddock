"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch, getApiBase, uploadFormDataWithProgress } from "@/components/lib/api";
import { isNameWithinLimit, MAX_NAME_LENGTH, nameLengthMessage } from "@/components/lib/nameValidation";
import { useAuth } from "@/components/auth/useAuth";
import { getDomainRole } from "@/components/auth/domain";
import { FolderPlus, UploadCloud, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
};
type User = {
    id: number;
    email: string;
    name?: string | null;
    role?: string | null;
};
type Ticket = {
    id: number;
    title: string;
    description?: string | null;
    createdAt: string;
    graphicData?: { project?: Project };
};
type FileUploadProgress = {
    key: string;
    name: string;
    size: number;
    percent: number;
    status: "queued" | "uploading" | "processing" | "completed" | "error";
    message?: string;
};

function userLabel(user: User) {
    return user.name ? `${user.name} (${user.email})` : user.email;
}

function MultiImageDropzone({
    files,
    onChange,
    progressItems = [],
    disabled = false,
}: {
    files: File[];
    onChange: (files: File[]) => void;
    progressItems?: FileUploadProgress[];
    disabled?: boolean;
}) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [dragOver, setDragOver] = React.useState(false);

    function accept(list: FileList | null) {
        if (disabled) return;
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
            <CardContent className="p-4 space-y-3">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    disabled={disabled}
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

                    <Button type="button" variant="outline" disabled={disabled} onClick={() => inputRef.current?.click()}>
                        Choose files
                    </Button>
                </div>

                {files.length > 0 && (
                    <div className="rounded-md border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Selected ({files.length})</p>
                            <Button type="button" variant="ghost" disabled={disabled} onClick={() => onChange([])}>
                                Clear
                            </Button>
                        </div>

                        <div className="max-h-56 overflow-auto space-y-2 pr-1">
                            {files.map((f, idx) => (
                                <div key={`${f.name}-${idx}`} className="space-y-2 rounded-md bg-muted/30 p-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm truncate">{f.name}</p>
                                            <p className="text-xs text-muted-foreground">{Math.round(f.size / 1024)} KB</p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={disabled}
                                            onClick={() => onChange(files.filter((_, i) => i !== idx))}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                    {progressItems[idx] && (
                                        <FileProgressRow item={progressItems[idx]} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function FileProgressRow({ item }: { item: FileUploadProgress }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="truncate">
                    {item.status === "queued"
                        ? "Waiting"
                        : item.status === "uploading"
                            ? "Uploading"
                            : item.status === "processing"
                                ? "Saving"
                                : item.status === "completed"
                                    ? "Completed"
                                    : "Failed"}
                    {item.message ? ` - ${item.message}` : ""}
                </span>
                <span className="shrink-0">{item.percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                    className={[
                        "h-full rounded-full transition-all duration-300",
                        item.status === "error" ? "bg-destructive" : "bg-primary",
                    ].join(" ")}
                    style={{ width: `${item.percent}%` }}
                />
            </div>
        </div>
    );
}

function connectGraphicUploadProgress(
    uploadId: string,
    onEvent: (event: { type: string; message?: string; overallPercent?: number }) => void,
) {
    const apiBase = getApiBase() ?? "";
    const eventSource = new EventSource(`${apiBase}/api/graphics/upload/progress/${uploadId}`, {
        withCredentials: true,
    });

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data) as { type: string; message?: string; overallPercent?: number };
            onEvent(data);
            if (data.type === "completed" || data.type === "error") {
                eventSource.close();
            }
        } catch {
            // Ignore malformed progress events without breaking the upload.
        }
    };

    eventSource.onerror = () => {
        eventSource.close();
    };

    return eventSource;
}

export default function CreateTicketPage() {
    const { me } = useAuth();
    const graphicsRole = me ? getDomainRole(me, "GRAPHICS") : null;
    const canManageProjects = graphicsRole === "ADMIN" || graphicsRole === "MANAGER";

    const [projects, setProjects] = React.useState<Project[]>([]);
    const [assignableUsers, setAssignableUsers] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [uploading, setUploading] = React.useState(false);

    const [projectId, setProjectId] = React.useState<number | null>(null);
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [files, setFiles] = React.useState<File[]>([]);
    const [fileProgress, setFileProgress] = React.useState<FileUploadProgress[]>([]);
    const [assigneeIds, setAssigneeIds] = React.useState<number[]>([]);
    const [assigneePickerId, setAssigneePickerId] = React.useState("");

    async function loadData() {
        setLoading(true);
        try {
            const [projectsData, usersData] = await Promise.all([
                apiFetch<Project[]>("/api/graphics/projects"),
                apiFetch<User[]>("/api/admin/users?module=GRAPHICS"),
            ]);
            setProjects(Array.isArray(projectsData) ? projectsData : []);
            setAssignableUsers(Array.isArray(usersData) ? usersData.filter((user) => user.role === "REVIEWER" || user.role === "DESIGNER") : []);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to load project data");
            setProjects([]);
            setAssignableUsers([]);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        loadData();
    }, []);

    React.useEffect(() => {
        if (!projectId) return;
        if (!projects.some((project) => project.id === projectId)) {
            setProjectId(null);
            setFiles([]);
            setFileProgress([]);
            setAssigneeIds([]);
        }
    }, [projects, projectId]);

    const canSubmit = Boolean(projectId && title.trim() && !uploading);
    const overallUploadPercent = fileProgress.length > 0
        ? Math.round(fileProgress.reduce((sum, item) => sum + item.percent, 0) / fileProgress.length)
        : 0;

    function updateFileProgress(index: number, patch: Partial<FileUploadProgress>) {
        setFileProgress((current) => current.map((item, idx) => idx === index ? { ...item, ...patch } : item));
    }

    async function createTicket(input: { title: string; description?: string; assigneeIds?: number[] }) {
        if (!projectId) return;

        const created = await apiFetch<Ticket>("/api/graphics/tickets", {
            method: "POST",
            body: JSON.stringify({ projectId, ...input }),
        });

        return created;
    }

    async function createTicketAndUpload() {
        if (!projectId) return;

        const ticketTitle = title.trim();
        if (!ticketTitle) {
            toast.error("Ticket name is required");
            return;
        }
        if (!isNameWithinLimit(title)) {
            toast.error(nameLengthMessage("Ticket name"));
            return;
        }
        if (assigneePickerId) {
            toast.error("Click Add to include the selected assignee, or clear the assignee field");
            return;
        }

        setUploading(true);
        try {
            const ticket = await createTicket({
                title: ticketTitle,
                description: description.trim() || undefined,
                assigneeIds,
            });

            if (!ticket) throw new Error("Failed to create ticket");

            setFileProgress(files.map((file, index) => ({
                key: `${file.name}-${file.size}-${index}`,
                name: file.name,
                size: file.size,
                percent: 0,
                status: "queued",
            })));

            for (const [index, file] of files.entries()) {
                const uploadId = crypto.randomUUID();
                const eventSource = connectGraphicUploadProgress(uploadId, (event) => {
                    if (event.type === "error") {
                        updateFileProgress(index, {
                            status: "error",
                            message: event.message ?? "Upload failed",
                        });
                        return;
                    }

                    if (typeof event.overallPercent === "number") {
                        updateFileProgress(index, {
                            percent: Math.max(60, event.overallPercent),
                            status: event.type === "completed" ? "completed" : "processing",
                            message: event.message,
                        });
                    }
                });

                const data = new FormData();
                data.append("file", file);
                data.append("fileName", file.name);
                data.append("title", file.name);
                data.append("version", "v1");

                updateFileProgress(index, {
                    status: "uploading",
                    message: "Sending file to server",
                });

                await uploadFormDataWithProgress(`/api/graphics/tickets/${ticket.id}/graphics?uploadId=${uploadId}`, data, {
                    method: "POST",
                    onProgress: (progress) => {
                        updateFileProgress(index, {
                            status: progress.percent >= 100 ? "processing" : "uploading",
                            percent: Math.min(60, Math.round(progress.percent * 0.6)),
                            message: progress.percent >= 100 ? "Saving to storage" : "Sending file to server",
                        });
                    },
                });

                eventSource.close();
                updateFileProgress(index, {
                    percent: 100,
                    status: "completed",
                    message: "Uploaded",
                });
            }

            toast.success(files.length > 0 ? "Ticket created and images uploaded" : "Ticket created successfully");
            setTitle("");
            setDescription("");
            setFiles([]);
            setFileProgress([]);
            setAssigneeIds([]);
            setAssigneePickerId("");
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to create ticket");
        } finally {
            setUploading(false);
        }
    }

    function addAssignee(userId: string) {
        const id = Number(userId);
        if (!id) return;
        setAssigneeIds((current) => current.includes(id) ? current : [...current, id]);
        setAssigneePickerId("");
    }

    const selectedAssignees = React.useMemo(
        () => assigneeIds.map((id) => assignableUsers.find((user) => user.id === id)).filter(Boolean) as User[],
        [assigneeIds, assignableUsers],
    );
    const pickerUser = assignableUsers.find((user) => String(user.id) === assigneePickerId) ?? null;

    return (
        <div className="mx-auto w-full max-w-5xl space-y-5 pb-12">
            <div>
                <h1 className="text-2xl font-semibold">Create Ticket</h1>
                <p className="text-sm text-muted-foreground">
                    Create a new ticket and optionally upload its first graphics.
                </p>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Ticket details</CardTitle>
                    <CardDescription>Select a project, name the ticket, and optionally upload its first graphics.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <div className="space-y-2">
                            <Label>Project</Label>
                            <div className="flex gap-2">
                                <Select
                                    value={projectId ? String(projectId) : ""}
                                    onValueChange={(v) => {
                                        const id = Number(v);
                                        setProjectId(id);
                                        setFiles([]);
                                        setFileProgress([]);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={loading ? "Loading projects..." : "Select project"} />
                                    </SelectTrigger>
                                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {canManageProjects && (
                                    <Button type="button" variant="outline" size="icon" asChild>
                                        <Link href="/graphicprojects" aria-label="Manage graphics projects">
                                            <FolderPlus className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Ticket name</Label>
                            <Input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="e.g. Landing page banner review"
                                maxLength={MAX_NAME_LENGTH}
                                disabled={uploading}
                            />
                        </div>
                    </div>

                    {!loading && projects.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            No graphics projects are available yet.
                        </p>
                    )}

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="What should reviewers check?"
                            rows={3}
                            disabled={uploading}
                        />
                    </div>

                    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                        <div className="space-y-1">
                            <Label>Assign ticket</Label>
                            <p className="text-xs text-muted-foreground">
                                Optional. Add reviewers or designers who should see this ticket immediately.
                            </p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                            <Combobox
                                items={assignableUsers}
                                value={pickerUser}
                                onValueChange={(user) => setAssigneePickerId(user ? String(user.id) : "")}
                                itemToStringLabel={userLabel}
                            >
                                <ComboboxInput
                                    placeholder={loading ? "Loading users..." : "Search reviewer/designer"}
                                    disabled={loading || uploading}
                                    showClear
                                    className="w-full"
                                />
                                <ComboboxContent>
                                    <ComboboxEmpty>No user found.</ComboboxEmpty>
                                    <ComboboxList>
                                        {(user) => (
                                            <ComboboxItem key={user.id} value={user}>
                                                <div className="min-w-0">
                                                    <p className="truncate">{user.name ?? user.email}</p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {user.role} {user.name ? `- ${user.email}` : ""}
                                                    </p>
                                                </div>
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            <Button type="button" variant="outline" onClick={() => addAssignee(assigneePickerId)} disabled={!assigneePickerId || uploading}>
                                Add
                            </Button>
                        </div>
                        {selectedAssignees.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedAssignees.map((user) => (
                                    <Badge key={user.id} variant="secondary" className="gap-1 pr-1">
                                        {user.name ?? user.email}
                                        <button
                                            type="button"
                                            onClick={() => setAssigneeIds((current) => current.filter((id) => id !== user.id))}
                                            className="rounded-full p-0.5 hover:bg-background"
                                            aria-label={`Remove ${user.email}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <MultiImageDropzone
                        files={files}
                        disabled={uploading}
                        progressItems={fileProgress}
                        onChange={(nextFiles) => {
                            setFiles(nextFiles);
                            if (!uploading) setFileProgress([]);
                        }}
                    />

                    {(uploading || fileProgress.length > 0) && files.length > 0 && (
                        <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Overall upload</span>
                                <span className="text-muted-foreground">{overallUploadPercent}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-300"
                                    style={{ width: `${overallUploadPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <Button
                            className="flex-1"
                            disabled={!canSubmit}
                            onClick={createTicketAndUpload}
                        >
                            {uploading ? "Creating..." : files.length > 0 ? "Create Ticket & Upload" : "Create Ticket"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setProjectId(null);
                                setTitle("");
                                setDescription("");
                                setFiles([]);
                                setFileProgress([]);
                                setAssigneeIds([]);
                                setAssigneePickerId("");
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
