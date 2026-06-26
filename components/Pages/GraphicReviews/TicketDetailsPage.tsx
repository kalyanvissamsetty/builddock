"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Download, Expand, Trash2, UploadCloud } from "lucide-react";
import { apiFetch, getApiBase, uploadFormDataWithProgress } from "@/components/lib/api";
import { useAuth } from "@/components/auth/useAuth";
import { getDomainRole } from "@/components/auth/domain";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FullscreenImageDialog } from "./FullscreenImageDialog";

type Comment = {
    id: number;
    text: string;
    createdAt: string;
    author: string;
    version: string;
};

type ApiUser = { id: number; name?: string | null; email: string };
type ApiComment = {
    id: number;
    text: string;
    createdAt: string;
    authorName?: string | null;
    authorEmail?: string | null;
    author?: ApiUser | null;
};
type GraphicVersion = {
    id: number;
    version: string;
    imageUrl: string;
    originalFileName?: string | null;
    uploadedAt: string;
    uploadedBy?: ApiUser | null;
    comments?: ApiComment[];
};
type TicketGraphic = { id: number; fileName: string; title: string; description?: string | null; versions: GraphicVersion[] };
type GraphicTicketStatus = "OPEN" | "IN_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "CLOSED";
type TicketAccess = { canView: boolean; accessScope: "ASSIGNED" | "ALL" | null };

type Ticket = {
    id: number;
    title: string;
    description?: string | null;
    status?: GraphicTicketStatus;
    currentUserTicketAccess?: TicketAccess;
    graphicData?: { project?: { id: number; name: string; slug: string } };
    graphics: TicketGraphic[];
};

const TICKET_STATUSES: Array<{ value: GraphicTicketStatus; label: string }> = [
    { value: "OPEN", label: "Open" },
    { value: "IN_REVIEW", label: "In review" },
    { value: "CHANGES_REQUESTED", label: "Changes requested" },
    { value: "APPROVED", label: "Approved" },
    { value: "CLOSED", label: "Closed" },
];

function statusLabel(status: GraphicTicketStatus | undefined) {
    return TICKET_STATUSES.find((item) => item.value === (status ?? "OPEN"))?.label ?? "Open";
}

function formatLocalDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function ClippedDescription({
    text,
    className,
    maxChars = 125,
}: {
    text?: string | null;
    className?: string;
    maxChars?: number;
}) {
    if (!text) return null;

    const normalized = text.trim();
    const visibleText = normalized.length > maxChars ? `${normalized.slice(0, maxChars).trimEnd()}...` : normalized;

    return (
        <p className={`whitespace-pre-wrap break-words ${className ?? ""}`}>{visibleText}</p>
    );
}

function fileNameFromDisposition(value: string | null) {
    if (!value) return null;

    const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    if (encoded) {
        try {
            return decodeURIComponent(encoded);
        } catch {
            return encoded;
        }
    }

    return value.match(/filename="([^"]+)"/i)?.[1] ?? null;
}

function clippedFileName(value: string, maxChars = 44) {
    if (value.length <= maxChars) return value;
    return `${value.slice(0, maxChars).trimEnd()}.....`;
}

async function fetchDownloadResponse(path: string) {
    const apiBase = getApiBase();
    const url = `${apiBase}${path}`;

    let response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
    });

    if (response.status === 401) {
        const refreshResponse = await fetch(`${apiBase}/api/auth/refresh`, {
            method: "POST",
            credentials: "include",
            cache: "no-store",
        });

        if (refreshResponse.ok) {
            response = await fetch(url, {
                method: "GET",
                credentials: "include",
                cache: "no-store",
            });
        }
    }

    return response;
}

type GraphicUploadProgress = {
    percent: number;
    status: "idle" | "uploading" | "processing" | "completed" | "error";
    message?: string;
};

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
            // Ignore malformed progress events without interrupting the upload.
        }
    };

    eventSource.onerror = () => {
        eventSource.close();
    };

    return eventSource;
}

function CommentsDialog({
    comments,
    versions,
    defaultVersion,
}: {
    comments: Comment[];
    versions: string[];
    defaultVersion?: string;
}) {
    const [sort, setSort] = React.useState<"NEWEST" | "OLDEST">("NEWEST");
    const fallbackVersion = versions.includes(defaultVersion ?? "") ? defaultVersion! : versions[0] ?? "ALL";
    const [version, setVersion] = React.useState<string>(fallbackVersion);

    React.useEffect(() => {
        const nextVersion = versions.includes(defaultVersion ?? "") ? defaultVersion! : versions[0] ?? "ALL";
        setVersion(nextVersion);
    }, [defaultVersion, versions]);

    const list = React.useMemo(() => {
        let xs = comments.slice();
        if (version !== "ALL") xs = xs.filter((c) => c.version === version);
        xs.sort((a, b) => {
            const da = new Date(a.createdAt).getTime();
            const db = new Date(b.createdAt).getTime();
            return sort === "NEWEST" ? db - da : da - db;
        });
        return xs;
    }, [comments, sort, version]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                    View comments
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Comments</DialogTitle>
                    <DialogDescription>Comments for this ticket image.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Select value={version} onValueChange={setVersion}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter version" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                            <SelectItem value="ALL">All versions</SelectItem>
                            {versions.map((v) => (
                                <SelectItem key={v} value={v}>
                                    {v}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                            <SelectItem value="NEWEST">Newest first</SelectItem>
                            <SelectItem value="OLDEST">Oldest first</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                <ScrollArea className="h-72 pr-3">
                    <div className="space-y-3">
                        {list.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No comments.</p>
                        ) : (
                            list.map((c) => (
                                <div key={c.id} className="rounded-md border p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-medium">{c.author}</p>
                                        <Badge variant="outline">{c.version}</Badge>
                                    </div>
                                    <p className="mt-2 text-sm">{c.text}</p>
                                    <p className="mt-2 text-xs text-muted-foreground">{formatLocalDateTime(c.createdAt)}</p>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AddCommentDialog({ onAdd }: { onAdd: (text: string) => Promise<void> }) {
    const [open, setOpen] = React.useState(false);
    const [text, setText] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    function closeDialog() {
        setText("");
        setOpen(false);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (nextOpen) {
                    setOpen(true);
                    return;
                }

                closeDialog();
            }}
        >
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    Add comment
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add comment</DialogTitle>
                    
                </DialogHeader>
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={5}
                    placeholder="Write comment..."
                    clearable={false}
                    className="h-44 max-h-60 resize-none overflow-y-auto field-sizing-fixed sm:h-52"
                />
                <DialogFooter>
                    <Button
                        type="button"
                        disabled={submitting}
                        onClick={async () => {
                            const t = text.trim();
                            if (!t) return;
                            setSubmitting(true);
                            try {
                                await onAdd(t);
                                closeDialog();
                            } catch (err: any) {
                                toast.error(err?.message ?? "Failed to add comment");
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                    >
                        {submitting ? "Submitting..." : "Submit"}
                    </Button>
                    <Button type="button" variant="outline" disabled={submitting} onClick={closeDialog}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function UploadNewVersionDialog({
    ticket,
    onUploadNewVersion,
    onUploadNewGraphic,
}: {
    ticket: Ticket;
    onUploadNewVersion: (fileName: string, file: File, uploadId: string, onClientProgress: (percent: number) => void) => Promise<void>;
    onUploadNewGraphic: (file: File, uploadId: string, onClientProgress: (percent: number) => void) => Promise<void>;
}) {
    const [open, setOpen] = React.useState(false);
    const fileNames = React.useMemo(() => ticket.graphics.map((g) => g.fileName), [ticket.graphics]);
    const hasExistingGraphics = fileNames.length > 0;
    const defaultMode = hasExistingGraphics ? "EXISTING" : "NEW";

    const [mode, setMode] = React.useState<"EXISTING" | "NEW">(defaultMode);
    const [selectedFileName, setSelectedFileName] = React.useState<string>("");
    const [file, setFile] = React.useState<File | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const [progress, setProgress] = React.useState<GraphicUploadProgress>({
        percent: 0,
        status: "idle",
    });
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const selectedFileIndex = selectedFileName ? fileNames.findIndex((name) => name === selectedFileName) : -1;

    function selectUploadFile(nextFile: File | null) {
        setFile(nextFile);
        if (fileInputRef.current && !nextFile) {
            fileInputRef.current.value = "";
        }
    }

    function openFilePicker() {
        if (!fileInputRef.current) return;
        fileInputRef.current.value = "";
        fileInputRef.current.click();
    }

    function handleUploadFile(nextFile: File | null) {
        if (!nextFile) return;

        const ok = ["image/png", "image/jpeg", "image/webp"].includes(nextFile.type);
        if (!ok) {
            toast.error("Only PNG, JPG, WEBP supported");
            return;
        }

        selectUploadFile(nextFile);
    }

    function reset() {
        setMode(defaultMode);
        setSelectedFileName("");
        selectUploadFile(null);
        setUploading(false);
        setProgress({ percent: 0, status: "idle" });
    }

    React.useEffect(() => {
        if (!hasExistingGraphics && mode === "EXISTING") {
            setMode("NEW");
        }
    }, [hasExistingGraphics, mode]);

    function closeAndReset() {
        reset();
        setOpen(false);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) reset();
            }}
        >
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <UploadCloud className="h-4 w-4" />
                    Upload
                </Button>
            </DialogTrigger>

            <DialogContent className="!w-[min(calc(100vw-2rem),42rem)] !max-w-[min(calc(100vw-2rem),42rem)] max-h-[calc(100vh-2rem)] overflow-x-hidden overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upload to ticket</DialogTitle>
                    <DialogDescription>
                        Upload a new version of an existing image, or add a fresh image as v1.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className={`grid min-w-0 gap-2 ${hasExistingGraphics ? "sm:grid-cols-2" : ""}`}>
                        {hasExistingGraphics && (
                            <Button
                                type="button"
                                variant={mode === "EXISTING" ? "default" : "outline"}
                                className="min-w-0"
                                disabled={uploading}
                                onClick={() => setMode("EXISTING")}
                            >
                                New version
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant={mode === "NEW" ? "default" : "outline"}
                            className="min-w-0"
                            disabled={uploading}
                            onClick={() => setMode("NEW")}
                        >
                            New graphic
                        </Button>
                    </div>

                    {mode === "EXISTING" && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Choose existing file</p>
                            <Select
                                value={selectedFileIndex >= 0 ? String(selectedFileIndex) : ""}
                                onValueChange={(value) => {
                                    const index = Number(value);
                                    setSelectedFileName(fileNames[index] ?? "");
                                }}
                            >
                                <SelectTrigger className="w-full min-w-0 overflow-hidden [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate" disabled={uploading}>
                                    <SelectValue placeholder="Select file name" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]">
                                    {fileNames.map((f, index) => (
                                        <SelectItem key={f} value={String(index)} title={f} className="min-w-0 max-w-full overflow-hidden pr-8">
                                            <span className="block min-w-0 max-w-full truncate">{clippedFileName(f)}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Upload will be stored as next version for this file name.
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Image file</p>
                            <Badge variant={file ? "secondary" : "outline"}>
                                {file ? "Ready" : "No file"}
                            </Badge>
                        </div>

                        <Card
                            className="border-dashed"
                            onDragOver={(e) => {
                                e.preventDefault();
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const f = e.dataTransfer.files?.[0];
                                handleUploadFile(f ?? null);
                            }}
                        >
                            <CardContent className="p-4 space-y-3">
                                <input
                                    ref={fileInputRef}
                                    id="ticket-upload-input"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] ?? null;
                                        handleUploadFile(f);
                                    }}
                                />

                                {!file ? (
                                    <div className="flex flex-col gap-3 rounded-md bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 space-y-1">
                                            <p className="text-sm font-medium">Drag & drop your image</p>
                                            <p className="text-xs text-muted-foreground">
                                                PNG / JPG / WEBP supported
                                            </p>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={uploading}
                                            onClick={openFilePicker}
                                        >
                                            Choose file
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid min-w-0 gap-3 overflow-hidden rounded-md border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <p className="truncate text-sm font-medium" title={file.name}>
                                                {clippedFileName(file.name, 52)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {Math.round(file.size / 1024)} KB • {file.type}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={uploading}
                                                onClick={openFilePicker}
                                            >
                                                Replace
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                disabled={uploading}
                                                onClick={() => selectUploadFile(null)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    {mode === "EXISTING"
                                        ? "This will be saved as the next version for the selected file."
                                        : "This will be added as a new graphic (v1) in this ticket."}
                                </p>

                                {(uploading || progress.status !== "idle") && (
                                    <div className="space-y-2 rounded-md bg-muted/30 p-3">
                                        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                            <span className="min-w-0 truncate" title={progress.message}>
                                                {progress.status === "uploading"
                                                    ? "Uploading"
                                                    : progress.status === "processing"
                                                        ? "Saving"
                                                        : progress.status === "completed"
                                                            ? "Completed"
                                                            : progress.status === "error"
                                                                ? "Failed"
                                                                : "Waiting"}
                                                {progress.message ? ` - ${clippedFileName(progress.message, 48)}` : ""}
                                            </span>
                                            <span className="shrink-0">{progress.percent}%</span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                                            <div
                                                className={[
                                                    "h-full rounded-full transition-all duration-300",
                                                    progress.status === "error" ? "bg-destructive" : "bg-primary",
                                                ].join(" ")}
                                                style={{ width: `${progress.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <DialogFooter className="min-w-0 flex-wrap">
                    <Button
                        disabled={uploading}
                        onClick={async () => {
                            if (!file) {
                                toast.error("Select a file");
                                return;
                            }

                            if (mode === "EXISTING") {
                                if (!selectedFileName) {
                                    toast.error("Select an existing file name");
                                    return;
                                }
                            }

                            const uploadId = crypto.randomUUID();
                            const eventSource = connectGraphicUploadProgress(uploadId, (event) => {
                                if (event.type === "error") {
                                    setProgress({
                                        status: "error",
                                        percent: progress.percent,
                                        message: event.message ?? "Upload failed",
                                    });
                                    return;
                                }

                                if (typeof event.overallPercent === "number") {
                                    setProgress({
                                        status: event.type === "completed" ? "completed" : "processing",
                                        percent: Math.max(60, event.overallPercent),
                                        message: event.message,
                                    });
                                }
                            });

                            setUploading(true);
                            setProgress({
                                status: "uploading",
                                percent: 0,
                                message: "Sending file to server",
                            });

                            try {
                                const onClientProgress = (percent: number) => {
                                    setProgress({
                                        status: percent >= 100 ? "processing" : "uploading",
                                        percent: Math.min(60, Math.round(percent * 0.6)),
                                        message: percent >= 100 ? "Saving to storage" : "Sending file to server",
                                    });
                                };

                                if (mode === "EXISTING") {
                                    await onUploadNewVersion(selectedFileName, file, uploadId, onClientProgress);
                                } else {
                                    await onUploadNewGraphic(file, uploadId, onClientProgress);
                                }

                                setProgress({
                                    status: "completed",
                                    percent: 100,
                                    message: "Uploaded",
                                });
                                closeAndReset();
                            } catch (err: any) {
                                setProgress({
                                    status: "error",
                                    percent: progress.percent,
                                    message: err?.message ?? "Upload failed",
                                });
                                toast.error(err?.message ?? "Upload failed");
                            } finally {
                                eventSource.close();
                                setUploading(false);
                            }
                        }}
                    >
                        {uploading ? "Uploading..." : "Upload"}
                    </Button>
                    <Button variant="outline" disabled={uploading} onClick={closeAndReset}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function TicketDetailsPage() {
    const { me } = useAuth();
    const router = useRouter();
    const graphicsRole = me ? getDomainRole(me, "GRAPHICS") : null;

    const params = useParams<{ ticketId?: string; ticketdId?: string }>();
    const ticketId = params?.ticketId || params?.ticketdId || "";

    const [ticket, setTicket] = React.useState<Ticket | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [updatingStatus, setUpdatingStatus] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [deletingTicket, setDeletingTicket] = React.useState(false);

    async function loadTicket(options: { showPageLoading?: boolean } = {}) {
        if (!ticketId) return;

        const showPageLoading = options.showPageLoading ?? !ticket;
        if (showPageLoading) setLoading(true);
        try {
            const data = await apiFetch<Ticket>(`/api/graphics/tickets/${ticketId}`);
            setTicket(data);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to load ticket");
            setTicket(null);
        } finally {
            if (showPageLoading) setLoading(false);
        }
    }

    React.useEffect(() => {
        loadTicket();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketId]);

    if (loading) {
        return (
            <div className="mx-auto w-full max-w-5xl p-6">
                <p className="text-sm text-muted-foreground">Loading ticket...</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="mx-auto w-full max-w-5xl p-6">
                <p className="text-sm text-muted-foreground">Ticket not found.</p>
            </div>
        );
    }

    async function uploadNewVersion(
        fileName: string,
        file: File,
        uploadId: string,
        onClientProgress: (percent: number) => void,
    ) {
        const currentTicket = ticket;
        if (!currentTicket) return;

        const graphic = currentTicket.graphics.find((item) => item.fileName === fileName);
        if (!graphic) return;

        const data = new FormData();
        data.append("file", file);
        data.append("version", `v${graphic.versions.length + 1}`);

        await uploadFormDataWithProgress(`/api/graphics/graphics/${graphic.id}/versions?uploadId=${uploadId}`, data, {
            method: "POST",
            onProgress: (progress) => onClientProgress(progress.percent),
        });
        toast.success("Uploaded new version");
        await loadTicket({ showPageLoading: false });
    }

    async function uploadNewGraphic(
        file: File,
        uploadId: string,
        onClientProgress: (percent: number) => void,
    ) {
        const currentTicket = ticket;
        if (!currentTicket) return;

        const data = new FormData();
        data.append("file", file);
        data.append("fileName", file.name);
        data.append("title", file.name);
        data.append("version", "v1");

        await uploadFormDataWithProgress(`/api/graphics/tickets/${currentTicket.id}/graphics?uploadId=${uploadId}`, data, {
            method: "POST",
            onProgress: (progress) => onClientProgress(progress.percent),
        });
        toast.success("Uploaded new graphic as v1");
        await loadTicket({ showPageLoading: false });
    }

    async function updateTicketStatus(status: GraphicTicketStatus) {
        const currentTicket = ticket;
        if (!currentTicket || currentTicket.status === status) return;

        setUpdatingStatus(true);
        try {
            const updated = await apiFetch<Ticket>(`/api/graphics/tickets/${currentTicket.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            });
            setTicket((current) => current ? { ...current, status: updated.status ?? status } : current);
            toast.success("Ticket status updated");
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to update ticket status");
        } finally {
            setUpdatingStatus(false);
        }
    }

    async function deleteTicket() {
        const currentTicket = ticket;
        if (!currentTicket || deletingTicket) return;

        setDeletingTicket(true);
        try {
            await apiFetch(`/api/graphics/tickets/${currentTicket.id}`, {
                method: "DELETE",
            });
            toast.success("Ticket deleted");
            router.push("/viewtickets");
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to delete ticket");
        } finally {
            setDeletingTicket(false);
            setDeleteDialogOpen(false);
        }
    }

    const canViewTicket = ticket.currentUserTicketAccess?.canView !== false;
    const canUpdateStatus = canViewTicket && (
        graphicsRole === "ADMIN" ||
        graphicsRole === "MANAGER" ||
        graphicsRole === "DESIGNER" ||
        graphicsRole === "REVIEWER"
    );
    const canUpload = canViewTicket && (
        graphicsRole === "ADMIN" ||
        graphicsRole === "MANAGER" ||
        graphicsRole === "DESIGNER"
    );
    const canDeleteTicket = canViewTicket && (
        graphicsRole === "ADMIN" ||
        graphicsRole === "MANAGER"
    );

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <Button variant="outline" size="sm" asChild className="w-fit gap-2">
                <Link href="/viewtickets">
                    <ArrowLeft className="h-4 w-4" />
                    Back to tickets
                </Link>
            </Button>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                    <h1 className="text-2xl font-semibold">{ticket.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        {ticket.graphicData?.project?.name ?? "Graphics project"} • Ticket #{ticket.id}
                    </p>
                    <ClippedDescription text={ticket.description} className="text-sm text-muted-foreground" />
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap sm:justify-end">
                    {canUpdateStatus ? (
                        <>
                            <Select
                                value={ticket.status ?? "OPEN"}
                                onValueChange={(value) => updateTicketStatus(value as GraphicTicketStatus)}
                                disabled={updatingStatus}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                    {TICKET_STATUSES.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {canUpload && (
                                <UploadNewVersionDialog
                                    ticket={ticket}
                                    onUploadNewVersion={uploadNewVersion}
                                    onUploadNewGraphic={uploadNewGraphic}
                                />
                            )}
                            {canDeleteTicket && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setDeleteDialogOpen(true)}
                                    aria-label="Delete ticket"
                                    title="Delete ticket"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    ) : (
                        <Badge variant="outline">{statusLabel(ticket.status)}</Badge>
                    )}
                </div>
            </div>

            <Separator />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {ticket.graphics.length === 0 ? (
                    <Card className="sm:col-span-2">
                        <CardContent className="flex min-h-52 items-center justify-center p-8 text-center">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">No graphics to display</p>
                                <p className="text-sm text-muted-foreground">
                                    Upload a new graphic to start collecting versions and comments for this ticket.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : ticket.graphics.map((g) => (
                    <TicketGraphicCard
                        key={g.id}
                        graphic={g}
                        canDownload={canViewTicket}
                        onUpdate={loadTicket}
                    />
                ))}
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !open && !deletingTicket && setDeleteDialogOpen(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete ticket?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete <span className="font-medium text-foreground">{ticket.title}</span>, including its graphics,
                            versions, comments, assignments, and uploaded files. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingTicket}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={deletingTicket}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={(event) => {
                                event.preventDefault();
                                deleteTicket();
                            }}
                        >
                            {deletingTicket ? "Deleting..." : "Delete ticket"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function TicketGraphicCard({
    graphic,
    canDownload,
    onUpdate,
}: {
    graphic: TicketGraphic;
    canDownload: boolean;
    onUpdate: () => Promise<void>;
}) {
    const [selectedVersion, setSelectedVersion] = React.useState(graphic.versions[0]?.version ?? "v1");
    const [downloading, setDownloading] = React.useState(false);

    React.useEffect(() => {
        if (!graphic.versions.some((v) => v.version === selectedVersion)) {
            setSelectedVersion(graphic.versions[0]?.version ?? "v1");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [graphic.versions]);

    const active = React.useMemo(
        () => graphic.versions.find((v) => v.version === selectedVersion) ?? graphic.versions[0],
        [graphic.versions, selectedVersion],
    );

    const comments = React.useMemo(() => {
        return graphic.versions.flatMap((version) =>
            (version.comments ?? []).map((comment) => ({
                id: comment.id,
                text: comment.text,
                createdAt: comment.createdAt,
                author: comment.authorName ?? comment.author?.name ?? comment.authorEmail ?? comment.author?.email ?? "Unknown",
                version: version.version,
            })),
        );
    }, [graphic.versions]);

    async function addComment(text: string) {
        if (!active?.id) return;

        await apiFetch(`/api/graphics/versions/${active.id}/comments`, {
            method: "POST",
            body: JSON.stringify({ text }),
        });
        toast.success("Comment added");
        await onUpdate();
    }

    async function downloadActiveGraphic() {
        if (!active?.id || !canDownload || downloading) return;

        setDownloading(true);
        try {
            const response = await fetchDownloadResponse(`/api/graphics/versions/${active.id}/download`);
            if (!response.ok) {
                let message = `Download failed: ${response.status}`;
                try {
                    const data = await response.json();
                    message = data?.message || message;
                } catch {
                    // ignore non-json download errors
                }
                throw new Error(message);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = fileNameFromDisposition(response.headers.get("Content-Disposition"))
                || active.originalFileName
                || graphic.fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(objectUrl);
            toast.success("Download started");
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to download graphic");
        } finally {
            setDownloading(false);
        }
    }

    return (
        <Card className="flex flex-col overflow-hidden">
            <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <CardTitle className="max-w-full break-all text-base leading-snug">{graphic.fileName}</CardTitle>
                    </div>
                    <Badge variant="secondary">{selectedVersion}</Badge>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Version" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                            {graphic.versions.map((v) => (
                                <SelectItem key={v.version} value={v.version}>
                                    {v.version} • {new Date(v.uploadedAt).toLocaleDateString()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                        {active?.imageUrl ? (
                            <FullscreenImageDialog title={`${graphic.fileName} (${selectedVersion})`} imageUrl={active.imageUrl} />
                        ) : null}

                        <Button
                            variant="outline"
                            size="icon"
                            title={canDownload ? "Download" : "Download unavailable"}
                            disabled={!canDownload || !active?.id || downloading}
                            onClick={downloadActiveGraphic}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
                <ClippedDescription text={graphic.description} className="text-sm text-muted-foreground" maxChars={125} />

                <div className="relative h-56 w-full overflow-hidden rounded-md border bg-muted">
                    {active?.imageUrl ? (
                        <FullscreenImageDialog
                            title={`${graphic.fileName} (${selectedVersion})`}
                            imageUrl={active.imageUrl}
                            trigger={
                                <button
                                    type="button"
                                    className="group relative block h-full w-full cursor-zoom-in overflow-hidden"
                                    aria-label={`Open ${graphic.fileName} fullscreen`}
                                >
                                    <Image src={active.imageUrl} alt={graphic.title} fill className="object-contain" unoptimized />
                                    <span className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-background/85 text-foreground opacity-0 shadow-sm transition group-hover:opacity-100">
                                        <Expand className="h-4 w-4" />
                                    </span>
                                </button>
                            }
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No preview</div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <AddCommentDialog
                        onAdd={addComment}
                    />
                    <CommentsDialog
                        comments={comments}
                        versions={graphic.versions.map((version) => version.version)}
                        defaultVersion={selectedVersion}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
