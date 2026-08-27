"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Download, Expand, FileText, History, Loader2, Trash2, UploadCloud } from "lucide-react";
import { apiFetch, getApiBase, refreshAuthSession, uploadFormDataWithProgress } from "@/components/lib/api";
import { useAuth } from "@/components/auth/useAuth";
import { getDefaultRouteForDomain, getDomainRole } from "@/components/auth/domain";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
type MentionableUser = { id: number; name?: string | null; email: string; roleKey?: string | null };
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
    previewImageUrl?: string | null;
    originalFileName?: string | null;
    uploadedAt: string;
    uploadedBy?: ApiUser | null;
    comments?: ApiComment[];
};
type TicketGraphic = { id: number; fileName: string; title: string; description?: string | null; versions: GraphicVersion[] };
type GraphicTicketStatus = "OPEN" | "IN_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "CLOSED";
type TicketAccess = { canView: boolean; accessScope: "ASSIGNED" | "ALL" | "CREATED" | null };
type TicketReference = {
    id: number;
    originalFileName: string;
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    uploadedByName?: string | null;
    uploadedByEmail?: string | null;
    uploadedBy?: ApiUser | null;
    createdAt: string;
};
type TicketActivity = {
    id: number;
    type: string;
    metadata?: Record<string, unknown> | null;
    actorName?: string | null;
    actorEmail?: string | null;
    actor?: ApiUser | null;
    createdAt: string;
};

type Ticket = {
    id: number;
    title: string;
    description?: string | null;
    deliveryDate?: string | null;
    status?: GraphicTicketStatus;
    currentUserTicketAccess?: TicketAccess;
    graphicData?: { project?: { id: number; name: string; slug: string } };
    graphics: TicketGraphic[];
    references?: TicketReference[];
    activities?: TicketActivity[];
};

const TICKET_STATUSES: Array<{ value: GraphicTicketStatus; label: string }> = [
    { value: "OPEN", label: "Open" },
    { value: "IN_REVIEW", label: "In review" },
    { value: "CHANGES_REQUESTED", label: "Changes requested" },
    { value: "APPROVED", label: "Approved" },
    { value: "CLOSED", label: "Closed" },
];

function errorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

function metadataText(value: unknown) {
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function mentionLabel(user: MentionableUser) {
    return user.name?.trim() || user.email.split("@")[0] || user.email;
}

function roleLabel(role?: string | null) {
    if (!role) return "Graphics";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mentionedIdsFromText(text: string, users: MentionableUser[]) {
    const normalizedText = text.toLowerCase();
    return users
        .filter((user) => {
            const labels = [mentionLabel(user), user.email].map((value) => value.toLowerCase());
            return labels.some((label) => {
                const pattern = new RegExp(`(^|\\s)@${escapeRegExp(label)}(?=\\s|$|[.,!?;:])`);
                return pattern.test(normalizedText);
            });
        })
        .map((user) => user.id);
}

function renderTextWithLinks(text: string, keyPrefix: string) {
    const urlPattern = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
    const exactUrlPattern = /^(https?:\/\/[^\s<]+|www\.[^\s<]+)$/i;

    return text.split(urlPattern).map((part, index) => {
        if (!exactUrlPattern.test(part)) return <React.Fragment key={`${keyPrefix}-${index}`}>{part}</React.Fragment>;

        const trailingMatch = part.match(/[),.!?;:]+$/);
        const trailing = trailingMatch?.[0] ?? "";
        const rawUrl = trailing ? part.slice(0, -trailing.length) : part;
        const href = rawUrl.startsWith("www.") ? `https://${rawUrl}` : rawUrl;

        return (
            <React.Fragment key={`${keyPrefix}-${index}`}>
                <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
                >
                    {rawUrl}
                </a>
                {trailing}
            </React.Fragment>
        );
    });
}

function renderCommentText(text: string, users: MentionableUser[]) {
    const labels = Array.from(
        new Set(users.flatMap((user) => [mentionLabel(user), user.email]).filter(Boolean)),
    ).sort((a, b) => b.length - a.length);

    const knownPattern = labels.length > 0 ? labels.map(escapeRegExp).join("|") : null;
    const mentionPattern = knownPattern
        ? new RegExp(`(@(?:${knownPattern}|[\\w.+-]+(?:@[\\w.-]+)?))`, "gi")
        : /(@[\w.+-]+(?:@[\w.-]+)?)/gi;

    return text.split(mentionPattern).map((part, index) => {
        if (!part.startsWith("@")) return <React.Fragment key={index}>{renderTextWithLinks(part, `text-${index}`)}</React.Fragment>;
        const rawLabel = part.slice(1).toLowerCase();
        const isKnownMention = labels.some((label) => label.toLowerCase() === rawLabel);
        return (
            <span
                key={index}
                className={`mx-0.5 inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-semibold ${
                    isKnownMention
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-muted bg-muted/70 text-foreground"
                }`}
            >
                {part}
            </span>
        );
    });
}

function authorDisplay(author: string) {
    if (!author.includes("@")) return { name: author, detail: null };
    const [local, domain] = author.split("@");
    return { name: local || author, detail: domain ?? null };
}

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
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(date);
}

function formatLocalDate(value: string) {
    return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
}

function formatFileSize(value?: number | null) {
    if (!value || value <= 0) return null;
    if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
    return `${(value / (1024 * 1024)).toFixed(value < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function referenceUploaderName(reference: TicketReference) {
    return reference.uploadedByName
        || reference.uploadedBy?.name
        || reference.uploadedByEmail?.split("@")[0]
        || reference.uploadedBy?.email?.split("@")[0]
        || "Unknown";
}

function activityActorName(activity: TicketActivity) {
    return activity.actorName
        || activity.actor?.name
        || activity.actorEmail?.split("@")[0]
        || activity.actor?.email?.split("@")[0]
        || "Someone";
}

function activityDetails(activity: TicketActivity) {
    const meta = activity.metadata ?? {};
    switch (activity.type) {
        case "TICKET_CREATED":
            return { text: "created this ticket", badge: metadataText(meta.ticketTitle) };
        case "TICKET_ASSIGNED":
            return { text: "assigned a ticket", badge: metadataText(meta.assigneeName) || metadataText(meta.assigneeEmail) };
        case "TICKET_UNASSIGNED":
            return { text: "removed ticket access", badge: metadataText(meta.assigneeName) || metadataText(meta.assigneeEmail) };
        case "STATUS_UPDATED":
            return { text: `changed status from ${statusLabel(metadataText(meta.fromStatus) as GraphicTicketStatus)} to ${statusLabel(metadataText(meta.toStatus) as GraphicTicketStatus)}`, badge: null };
        case "GRAPHIC_UPLOADED":
            return { text: "uploaded a new graphic", badge: `${metadataText(meta.graphicName) || metadataText(meta.fileName) || "Graphic"}${metadataText(meta.versionName) ? ` • ${metadataText(meta.versionName)}` : ""}` };
        case "GRAPHIC_VERSION_UPLOADED":
            return { text: "uploaded a new graphic version", badge: `${metadataText(meta.graphicName) || metadataText(meta.fileName) || "Graphic"}${metadataText(meta.versionName) ? ` • ${metadataText(meta.versionName)}` : ""}` };
        case "GRAPHIC_DOWNLOADED":
            return { text: "downloaded a graphic", badge: `${metadataText(meta.graphicName) || metadataText(meta.fileName) || "Graphic"}${metadataText(meta.versionName) ? ` • ${metadataText(meta.versionName)}` : ""}` };
        case "COMMENT_ADDED":
            return { text: "commented on a graphic", badge: `${metadataText(meta.graphicName) || "Graphic"}${metadataText(meta.versionName) ? ` • ${metadataText(meta.versionName)}` : ""}` };
        case "REFERENCE_UPLOADED":
            return { text: "uploaded a reference", badge: metadataText(meta.referenceName) || metadataText(meta.fileName) };
        case "REFERENCE_DOWNLOADED":
            return { text: "downloaded a reference", badge: metadataText(meta.referenceName) || metadataText(meta.fileName) };
        case "REFERENCE_DELETED":
            return { text: "deleted a reference", badge: metadataText(meta.referenceName) || metadataText(meta.fileName) };
        default:
            return { text: activity.type.toLowerCase().replaceAll("_", " "), badge: null };
    }
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

function getLatestGraphicVersion(versions: GraphicVersion[]) {
    return versions
        .slice()
        .sort((a, b) => {
            const dateDiff = new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
            if (dateDiff !== 0) return dateDiff;
            return b.id - a.id;
        })[0];
}

function getSortedGraphicVersions(versions: GraphicVersion[]) {
    return versions
        .slice()
        .sort((a, b) => {
            const dateDiff = new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
            if (dateDiff !== 0) return dateDiff;
            return b.id - a.id;
        });
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
        const refreshed = await refreshAuthSession();
        if (refreshed) {
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
    mentionUsers,
}: {
    comments: Comment[];
    versions: string[];
    defaultVersion?: string;
    mentionUsers: MentionableUser[];
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
            <DialogContent className="!flex max-h-[88vh] flex-col overflow-hidden sm:max-w-3xl">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Comments</DialogTitle>
                    <DialogDescription>Comments for this ticket image.</DialogDescription>
                </DialogHeader>

                <div className="grid shrink-0 gap-3 sm:grid-cols-2">
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

                    <Select value={sort} onValueChange={(v) => setSort(v as "NEWEST" | "OLDEST")}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                            <SelectItem value="NEWEST">Newest first</SelectItem>
                            <SelectItem value="OLDEST">Oldest first</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="h-[44vh] min-h-[220px] max-h-[420px] overflow-y-auto overscroll-contain pr-3 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted/40">
                    <div className="space-y-3 pb-3">
                        {list.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No comments.</p>
                        ) : (
                            list.map((c) => {
                                const author = authorDisplay(c.author);
                                return (
                                    <div key={c.id} className="rounded-lg border bg-background p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                                                    <p className="max-w-full truncate text-sm font-semibold text-foreground">
                                                        {author.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatLocalDateTime(c.createdAt)}
                                                </span>
                                                <Badge variant="outline" className="rounded-full px-3">
                                                    {c.version}
                                                </Badge>
                                            </div>
                                        </div>
                                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                                            {renderCommentText(c.text, mentionUsers)}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <DialogFooter className="shrink-0 pt-4">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AddCommentDialog({
    onAdd,
    mentionUsers,
}: {
    onAdd: (text: string, mentionedUserIds: number[]) => Promise<void>;
    mentionUsers: MentionableUser[];
}) {
    const [open, setOpen] = React.useState(false);
    const [text, setText] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [cursor, setCursor] = React.useState(0);
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    const activeMention = React.useMemo(() => {
        const beforeCursor = text.slice(0, cursor);
        const atIndex = beforeCursor.lastIndexOf("@");
        if (atIndex < 0) return null;
        const query = beforeCursor.slice(atIndex + 1);
        if (/\s/.test(query)) return null;
        return { atIndex, query: query.toLowerCase() };
    }, [cursor, text]);

    const mentionOptions = React.useMemo(() => {
        if (!activeMention) return [];
        return mentionUsers
            .filter((user) => {
                const label = mentionLabel(user).toLowerCase();
                const email = user.email.toLowerCase();
                return !activeMention.query || label.includes(activeMention.query) || email.includes(activeMention.query);
            });
    }, [activeMention, mentionUsers]);

    function closeDialog() {
        setText("");
        setCursor(0);
        setOpen(false);
    }

    function updateCursor(target: HTMLTextAreaElement) {
        setCursor(target.selectionStart ?? target.value.length);
    }

    function insertMention(user: MentionableUser) {
        if (!activeMention) return;
        const label = mentionLabel(user);
        const nextText = `${text.slice(0, activeMention.atIndex)}@${label} ${text.slice(cursor)}`;
        const nextCursor = activeMention.atIndex + label.length + 2;
        setText(nextText);
        setCursor(nextCursor);
        requestAnimationFrame(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
        });
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
                <div className="relative">
                    <Textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            updateCursor(e.target);
                        }}
                        onClick={(e) => updateCursor(e.currentTarget)}
                        onKeyUp={(e) => updateCursor(e.currentTarget)}
                        rows={5}
                        placeholder="Write comment..."
                        clearable={false}
                        className="h-44 max-h-60 resize-none overflow-y-auto field-sizing-fixed sm:h-52"
                    />
                    {mentionOptions.length > 0 && (
                        <div className="absolute left-2 top-12 z-50 max-h-52 w-[min(320px,calc(100%-1rem))] overflow-y-auto rounded-md border bg-background p-1 shadow-lg">
                            {mentionOptions.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    className="flex w-full min-w-0 items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-muted"
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        insertMention(user);
                                    }}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium">{mentionLabel(user)}</span>
                                        <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                                    </span>
                                    <Badge variant="outline" className="shrink-0">{roleLabel(user.roleKey)}</Badge>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        disabled={submitting}
                        onClick={async () => {
                            const t = text.trim();
                            if (!t) return;
                            const mentionedUserIds = mentionedIdsFromText(t, mentionUsers);
                            setSubmitting(true);
                            try {
                                await onAdd(t, mentionedUserIds);
                                closeDialog();
                            } catch (err: unknown) {
                                toast.error(errorMessage(err, "Failed to add comment"));
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
                    {hasExistingGraphics && (
                        <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                            <Button
                                type="button"
                                variant={mode === "EXISTING" ? "default" : "outline"}
                                className="min-w-0"
                                disabled={uploading}
                                onClick={() => setMode("EXISTING")}
                            >
                                New version
                            </Button>
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
                    )}

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
                            } catch (err: unknown) {
                                setProgress({
                                    status: "error",
                                    percent: progress.percent,
                                    message: errorMessage(err, "Upload failed"),
                                });
                                toast.error(errorMessage(err, "Upload failed"));
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
    const [mentionUsers, setMentionUsers] = React.useState<MentionableUser[]>([]);
    const ticketRef = React.useRef<Ticket | null>(null);

    React.useEffect(() => {
        ticketRef.current = ticket;
    }, [ticket]);

    async function loadTicket(options: { showPageLoading?: boolean } = {}) {
        if (!ticketId) return;

        const showPageLoading = options.showPageLoading ?? !ticketRef.current;
        if (showPageLoading) setLoading(true);
        try {
            const data = await apiFetch<Ticket>(`/api/graphics/tickets/${ticketId}`);
            setTicket(data);
        } catch (err: unknown) {
            setTicket(null);
            const message = errorMessage(err, "Ticket not found");
            toast.error(message);
            if (showPageLoading && me) {
                router.replace(getDefaultRouteForDomain(me, "GRAPHICS"));
            }
        } finally {
            if (showPageLoading) setLoading(false);
        }
    }

    const loadMentionUsers = React.useCallback(async () => {
        if (!ticketId) return;

        try {
            const data = await apiFetch<MentionableUser[]>(`/api/graphics/tickets/${ticketId}/comment-participants`);
            setMentionUsers(Array.isArray(data) ? data : []);
        } catch {
            setMentionUsers([]);
        }
    }, [ticketId]);

    React.useEffect(() => {
        loadTicket();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketId]);

    React.useEffect(() => {
        if (!ticketId || !ticket) return;

        const apiBase = getApiBase() ?? "";
        const eventSource = new EventSource(`${apiBase}/api/graphics/tickets/${ticketId}/activity/stream`, {
            withCredentials: true,
        });
        let refreshTimer: ReturnType<typeof setTimeout> | null = null;

        function scheduleRefresh() {
            if (refreshTimer) clearTimeout(refreshTimer);
            refreshTimer = setTimeout(() => {
                loadTicket({ showPageLoading: false });
                loadMentionUsers();
            }, 250);
        }

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as { type?: string };
                if (data.type === "activity") scheduleRefresh();
            } catch {
                // Ignore malformed realtime events; the page still works with manual refreshes/actions.
            }
        };

        eventSource.onerror = () => {
            // Browser EventSource retries automatically using the server-provided retry interval.
        };

        return () => {
            if (refreshTimer) clearTimeout(refreshTimer);
            eventSource.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketId, Boolean(ticket), loadMentionUsers]);

    React.useEffect(() => {
        if (!ticketId) return;

        loadMentionUsers();
    }, [ticketId, loadMentionUsers]);

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
            await apiFetch<Ticket>(`/api/graphics/tickets/${currentTicket.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            });
            await loadTicket({ showPageLoading: false });
            toast.success("Ticket status updated");
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Failed to update ticket status"));
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
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Failed to delete ticket"));
        } finally {
            setDeletingTicket(false);
            setDeleteDialogOpen(false);
        }
    }

    const canViewTicket = ticket.currentUserTicketAccess?.canView !== false;
    const isTicketCreator = ticket.currentUserTicketAccess?.accessScope === "CREATED";
    const canUpdateStatus = canViewTicket && (
        graphicsRole === "ADMIN" ||
        graphicsRole === "MANAGER" ||
        graphicsRole === "DESIGNER" ||
        graphicsRole === "REVIEWER"
    );
    const canUpload = canViewTicket && (
        graphicsRole === "ADMIN" ||
        graphicsRole === "MANAGER" ||
        graphicsRole === "DESIGNER" ||
        isTicketCreator
    );
    const canDeleteTicket = canViewTicket && (
        graphicsRole === "ADMIN" ||
        graphicsRole === "MANAGER" ||
        isTicketCreator
    );
    const canDeleteReferences = canViewTicket && (
        graphicsRole === "ADMIN" ||
        graphicsRole === "MANAGER" ||
        graphicsRole === "REVIEWER"
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
                    {ticket.deliveryDate ? (
                        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            Delivery date: {formatLocalDate(ticket.deliveryDate)}
                        </p>
                    ) : null}
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
                    <div className="flex justify-center" style={{ gridColumn: "1 / -1" }}>
                        <Card className="w-full max-w-3xl">
                            <CardContent className="flex min-h-52 items-center justify-center p-8 text-center">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">No graphics to display</p>
                                    <p className="text-sm text-muted-foreground">
                                        Upload a new graphic to start collecting versions and comments for this ticket.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : ticket.graphics.map((g) => (
                    <TicketGraphicCard
                        key={g.id}
                        graphic={g}
                        canDownload={canViewTicket}
                        onUpdate={loadTicket}
                        mentionUsers={mentionUsers}
                    />
                ))}
            </div>

            <TicketReferencesSection
                ticketId={ticket.id}
                references={ticket.references ?? []}
                canUpload={canViewTicket}
                canDelete={canDeleteReferences}
                onUpdate={() => loadTicket({ showPageLoading: false })}
            />

            <TicketActivitySection activities={ticket.activities ?? []} />

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

function TicketReferencesSection({
    ticketId,
    references,
    canUpload,
    canDelete,
    onUpdate,
}: {
    ticketId: number;
    references: TicketReference[];
    canUpload: boolean;
    canDelete: boolean;
    onUpdate: () => Promise<void>;
}) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState<GraphicUploadProgress | null>(null);
    const [downloadingId, setDownloadingId] = React.useState<number | null>(null);
    const [deletingId, setDeletingId] = React.useState<number | null>(null);

    async function uploadReferences(files: FileList | null) {
        if (!files || files.length === 0 || uploading) return;

        const picked = Array.from(files);
        const tooLarge = picked.find((file) => file.size > 50 * 1024 * 1024);
        if (tooLarge) {
            toast.error("Each reference file must be 50 MB or less");
            return;
        }

        setUploading(true);
        try {
            for (const file of picked) {
                const uploadId = crypto.randomUUID();
                const eventSource = connectGraphicUploadProgress(uploadId, (event) => {
                    if (event.type === "error") {
                        setUploadProgress({ percent: 0, status: "error", message: event.message ?? "Upload failed" });
                        return;
                    }
                    if (typeof event.overallPercent === "number") {
                        setUploadProgress({
                            percent: Math.max(60, event.overallPercent),
                            status: event.type === "completed" ? "completed" : "processing",
                            message: event.message,
                        });
                    }
                });

                const data = new FormData();
                data.append("file", file);
                setUploadProgress({ percent: 0, status: "uploading", message: `Uploading ${file.name}` });

                await uploadFormDataWithProgress(`/api/graphics/tickets/${ticketId}/references?uploadId=${uploadId}`, data, {
                    method: "POST",
                    onProgress: (progress) => {
                        setUploadProgress({
                            status: progress.percent >= 100 ? "processing" : "uploading",
                            percent: Math.min(60, Math.round(progress.percent * 0.6)),
                            message: progress.percent >= 100 ? "Saving to storage" : `Uploading ${file.name}`,
                        });
                    },
                });

                eventSource.close();
                setUploadProgress({ percent: 100, status: "completed", message: `${file.name} uploaded` });
            }

            toast.success(picked.length > 1 ? "References uploaded" : "Reference uploaded");
            await onUpdate();
            setUploadProgress(null);
        } catch (err: unknown) {
            setUploadProgress({ percent: 0, status: "error", message: errorMessage(err, "Upload failed") });
            toast.error(errorMessage(err, "Failed to upload reference"));
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    async function downloadReference(reference: TicketReference) {
        if (downloadingId) return;

        setDownloadingId(reference.id);
        try {
            const response = await fetchDownloadResponse(`/api/graphics/references/${reference.id}/download`);
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
            link.download = fileNameFromDisposition(response.headers.get("Content-Disposition")) || reference.originalFileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(objectUrl);
            toast.success("Download started");
            await onUpdate();
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Failed to download reference"));
        } finally {
            setDownloadingId(null);
        }
    }

    async function deleteReference(reference: TicketReference) {
        if (deletingId) return;

        setDeletingId(reference.id);
        try {
            await apiFetch(`/api/graphics/references/${reference.id}`, { method: "DELETE" });
            toast.success("Reference deleted");
            await onUpdate();
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Failed to delete reference"));
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4" />
                        References
                    </CardTitle>
                    <CardDescription>Files shared for design context and review decisions.</CardDescription>
                </div>
                {canUpload && (
                    <div>
                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            className="hidden"
                            disabled={uploading}
                            onChange={(event) => uploadReferences(event.target.files)}
                        />
                        <Button type="button" size="sm" className="gap-2" disabled={uploading} onClick={() => inputRef.current?.click()}>
                            <UploadCloud className="h-4 w-4" />
                            Upload reference
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                {uploadProgress && (
                    <div className="rounded-md border bg-muted/20 p-3">
                        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                            <span className="truncate">{uploadProgress.message ?? "Uploading"}</span>
                            <span>{uploadProgress.percent}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-border">
                            <div
                                className={`h-full rounded-full ${uploadProgress.status === "error" ? "bg-destructive" : "bg-primary"}`}
                                style={{ width: `${uploadProgress.percent}%` }}
                            />
                        </div>
                    </div>
                )}

                {references.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        No references uploaded yet.
                    </div>
                ) : (
                    <div className="min-w-0 divide-y rounded-md border">
                        {references.map((reference) => {
                            const fileSize = formatFileSize(reference.fileSizeBytes);
                            return (
                                <div key={reference.id} className="grid min-w-0 gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                                    <div className="min-w-0 space-y-1">
                                        <button
                                            type="button"
                                            className="block w-full min-w-0 truncate text-left text-sm font-medium underline-offset-2 hover:underline"
                                            onClick={() => downloadReference(reference)}
                                            disabled={downloadingId === reference.id}
                                            title={reference.originalFileName}
                                        >
                                            {reference.originalFileName}
                                        </button>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {[
                                                fileSize,
                                                `Uploaded by ${referenceUploaderName(reference)}`,
                                                formatLocalDateTime(reference.createdAt),
                                            ].filter(Boolean).join(" • ")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 sm:justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => downloadReference(reference)}
                                            disabled={downloadingId === reference.id}
                                            aria-label={`Download ${reference.originalFileName}`}
                                            title="Download reference"
                                        >
                                            {downloadingId === reference.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Download className="h-4 w-4" />
                                            )}
                                        </Button>
                                        {canDelete && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => deleteReference(reference)}
                                                disabled={deletingId === reference.id}
                                                aria-label={`Delete ${reference.originalFileName}`}
                                                title="Delete reference"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TicketActivitySection({ activities }: { activities: TicketActivity[] }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4" />
                    Activity
                </CardTitle>
                <CardDescription>Recent ticket changes, uploads, comments, and downloads.</CardDescription>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        No activity yet.
                    </div>
                ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-2">
                        {activities.map((activity) => {
                            const details = activityDetails(activity);
                            return (
                                <div key={activity.id} className="rounded-md border p-3">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-sm">
                                                <span className="font-semibold">{activityActorName(activity)}</span>{" "}
                                                <span className="text-muted-foreground">{details.text}</span>
                                            </p>
                                            {details.badge ? (
                                                <Badge variant="secondary" className="mt-2 max-w-full truncate">
                                                    {String(details.badge)}
                                                </Badge>
                                            ) : null}
                                        </div>
                                        <span className="shrink-0 text-xs text-muted-foreground">
                                            {formatLocalDateTime(activity.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TicketGraphicCard({
    graphic,
    canDownload,
    onUpdate,
    mentionUsers,
}: {
    graphic: TicketGraphic;
    canDownload: boolean;
    onUpdate: () => Promise<void>;
    mentionUsers: MentionableUser[];
}) {
    const sortedVersions = React.useMemo(() => getSortedGraphicVersions(graphic.versions), [graphic.versions]);
    const latestVersion = sortedVersions[0];
    const [selectedVersion, setSelectedVersion] = React.useState(latestVersion?.version ?? "v1");
    const [downloading, setDownloading] = React.useState(false);

    React.useEffect(() => {
        const nextLatest = getLatestGraphicVersion(graphic.versions);
        setSelectedVersion(nextLatest?.version ?? "v1");
    }, [graphic.versions]);

    const active = React.useMemo(
        () => sortedVersions.find((v) => v.version === selectedVersion) ?? latestVersion,
        [latestVersion, selectedVersion, sortedVersions],
    );
    const displayImageUrl = active?.previewImageUrl || active?.imageUrl;

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

    async function addComment(text: string, mentionedUserIds: number[]) {
        if (!active?.id) return;

        await apiFetch(`/api/graphics/versions/${active.id}/comments`, {
            method: "POST",
            body: JSON.stringify({ text, mentionedUserIds }),
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
            await onUpdate();
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Failed to download graphic"));
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
                            {sortedVersions.map((v) => (
                                <SelectItem key={v.version} value={v.version}>
                                    {v.version} • {new Date(v.uploadedAt).toLocaleDateString()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                        {displayImageUrl ? (
                            <FullscreenImageDialog title={`${graphic.fileName} (${selectedVersion})`} imageUrl={displayImageUrl} />
                        ) : null}

                        <Button
                            variant="outline"
                            size="icon"
                            title={canDownload ? "Download" : "Download unavailable"}
                            disabled={!canDownload || !active?.id || downloading}
                            onClick={downloadActiveGraphic}
                        >
                            {downloading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
                <ClippedDescription text={graphic.description} className="text-sm text-muted-foreground" maxChars={125} />

                <div className="relative h-56 w-full overflow-hidden rounded-md border bg-muted">
                    {displayImageUrl ? (
                        <FullscreenImageDialog
                            title={`${graphic.fileName} (${selectedVersion})`}
                            imageUrl={displayImageUrl}
                            trigger={
                                <button
                                    type="button"
                                    className="group relative block h-full w-full cursor-zoom-in overflow-hidden"
                                    aria-label={`Open ${graphic.fileName} fullscreen`}
                                >
                                    <Image src={displayImageUrl} alt={graphic.title} fill className="object-contain" unoptimized />
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
                        mentionUsers={mentionUsers}
                    />
                    <CommentsDialog
                        comments={comments}
                        versions={sortedVersions.map((version) => version.version)}
                        defaultVersion={selectedVersion}
                        mentionUsers={mentionUsers}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
