"use client";

import * as React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Download, Expand, UploadCloud, Plus } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Comment = {
    id: number;
    text: string;
    createdAt: string;
    author: string;
    version: string;
};

type GraphicVersion = { version: string; imageUrl: string; uploadedAt: string; uploadedBy: string };
type TicketGraphic = { id: number; fileName: string; title: string; description: string; versions: GraphicVersion[]; comments: Comment[] };

type Ticket = { id: number; projectName: string; title: string; description?: string; graphics: TicketGraphic[] };

// Mock ticket data keyed by ticketId
const MOCK_TICKETS_BY_ID: Record<string, Ticket> = {
    "101": {
        id: 101,
        projectName: "PG&E Substation",
        title: "Landing page graphics review",
        description: "Need contrast + alignment review.",
        graphics: [
            {
                id: 1,
                fileName: "banner.png",
                title: "Homepage Banner",
                description: "Hero image for landing page.",
                versions: [
                    { version: "v1", imageUrl: "https://picsum.photos/seed/t101-b1/1200/800", uploadedAt: "2026-04-20", uploadedBy: "qa@tims.group" },
                    { version: "v2", imageUrl: "https://picsum.photos/seed/t101-b2/900/1200", uploadedAt: "2026-04-22", uploadedBy: "dev@tims.group" },
                ],
                comments: [
                    { id: 11, text: "Increase contrast for the headline.", createdAt: "2026-04-21", author: "QA Team", version: "v1" },
                ],
            },
            {
                id: 2,
                fileName: "poster.jpg",
                title: "Safety Poster",
                description: "Poster for training module.",
                versions: [
                    { version: "v1", imageUrl: "https://picsum.photos/seed/t101-p1/1000/600", uploadedAt: "2026-04-20", uploadedBy: "dev@tims.group" },
                ],
                comments: [],
            },
        ],
    },
};

function FullscreenImageDialog({ title, imageUrl }: { title: string; imageUrl: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Fullscreen">
                    <Expand className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Fullscreen preview</DialogDescription>
                </DialogHeader>
                <div className="relative h-[70vh] w-full overflow-hidden rounded-md border bg-muted">
                    <Image src={imageUrl} alt={title} fill className="object-contain" unoptimized />
                </div>
                <DialogFooter>
                    <Button variant="outline">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CommentsDialog({ comments }: { comments: Comment[] }) {
    const [sort, setSort] = React.useState<"NEWEST" | "OLDEST">("NEWEST");
    const versions = React.useMemo(() => Array.from(new Set(comments.map((c) => c.version))).sort(), [comments]);
    const [version, setVersion] = React.useState<string>("ALL");

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
                    <DialogDescription>Mock comments for this ticket image.</DialogDescription>
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
                                    <p className="mt-2 text-xs text-muted-foreground">{c.createdAt}</p>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AddCommentDialog({ onAdd }: { onAdd: (text: string) => void }) {
    const [open, setOpen] = React.useState(false);
    const [text, setText] = React.useState("");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Add comment
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add comment</DialogTitle>
                    <DialogDescription>Mock comment dialog.</DialogDescription>
                </DialogHeader>
                <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Write comment..." />
                <DialogFooter>
                    <Button
                        onClick={() => {
                            const t = text.trim();
                            if (!t) return;
                            onAdd(t);
                            setText("");
                            setOpen(false);
                            toast.success("Comment added (mock)");
                        }}
                    >
                        Submit
                    </Button>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
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
    onUploadNewVersion: (fileName: string, file: File) => void;
    onUploadNewGraphic: (file: File) => void;
}) {
    const [open, setOpen] = React.useState(false);
    const [mode, setMode] = React.useState<"EXISTING" | "NEW">("EXISTING");
    const [selectedFileName, setSelectedFileName] = React.useState<string>("");
    const [file, setFile] = React.useState<File | null>(null);

    const fileNames = React.useMemo(() => ticket.graphics.map((g) => g.fileName), [ticket.graphics]);

    function reset() {
        setMode("EXISTING");
        setSelectedFileName("");
        setFile(null);
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

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload to ticket</DialogTitle>
                    <DialogDescription>
                        Upload a new version of an existing image, or add a fresh image as v1.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                            type="button"
                            variant={mode === "EXISTING" ? "default" : "outline"}
                            onClick={() => setMode("EXISTING")}
                        >
                            New version
                        </Button>
                        <Button
                            type="button"
                            variant={mode === "NEW" ? "default" : "outline"}
                            onClick={() => setMode("NEW")}
                        >
                            New graphic
                        </Button>
                    </div>

                    {mode === "EXISTING" && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Choose existing file</p>
                            <Select value={selectedFileName} onValueChange={setSelectedFileName}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select file name" />
                                </SelectTrigger>
                                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                    {fileNames.map((f) => (
                                        <SelectItem key={f} value={f}>
                                            {f}
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
                                if (!f) return;

                                const ok = ["image/png", "image/jpeg", "image/webp"].includes(f.type);
                                if (!ok) {
                                    toast.error("Only PNG, JPG, WEBP supported");
                                    return;
                                }
                                setFile(f);
                            }}
                        >
                            <CardContent className="p-4 space-y-3">
                                <input
                                    id="ticket-upload-input"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] ?? null;
                                        if (!f) return;

                                        const ok = ["image/png", "image/jpeg", "image/webp"].includes(f.type);
                                        if (!ok) {
                                            toast.error("Only PNG, JPG, WEBP supported");
                                            return;
                                        }
                                        setFile(f);
                                    }}
                                />

                                {!file ? (
                                    <div className="flex items-center justify-between gap-3 rounded-md bg-muted/30 p-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Drag & drop your image</p>
                                            <p className="text-xs text-muted-foreground">
                                                PNG / JPG / WEBP supported
                                            </p>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById("ticket-upload-input")?.click()}
                                        >
                                            Choose file
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between gap-3 rounded-md border bg-background p-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {Math.round(file.size / 1024)} KB • {file.type}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => document.getElementById("ticket-upload-input")?.click()}
                                            >
                                                Replace
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setFile(null)}
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
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={() => {
                            if (!file) {
                                toast.error("Select a file");
                                return;
                            }

                            if (mode === "EXISTING") {
                                if (!selectedFileName) {
                                    toast.error("Select an existing file name");
                                    return;
                                }
                                onUploadNewVersion(selectedFileName, file);
                                toast.success("Uploaded new version (mock)");
                            } else {
                                onUploadNewGraphic(file);
                                toast.success("Uploaded new graphic as v1 (mock)");
                            }

                            setOpen(false);
                        }}
                    >
                        Upload
                    </Button>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function TicketDetailsPage() {
    const params = useParams<{ ticketId: string }>();
    const ticketId = params?.ticketId || "101";

    const [ticket, setTicket] = React.useState<Ticket | null>(() => MOCK_TICKETS_BY_ID[ticketId] ?? null);

    if (!ticket) {
        return (
            <div className="mx-auto w-full max-w-5xl p-6">
                <p className="text-sm text-muted-foreground">Ticket not found (mock).</p>
            </div>
        );
    }

    function uploadNewVersion(fileName: string, file: File) {
        // mock: append a new version with a new random image URL
        setTicket((prev) => {
            if (!prev) return prev;
            const next = structuredClone(prev);

            const g = next.graphics.find((x) => x.fileName === fileName);
            if (!g) return prev;

            const nextNum = g.versions.length + 1;
            g.versions.unshift({
                version: `v${nextNum}`,
                imageUrl: `https://picsum.photos/seed/${encodeURIComponent(file.name + "-" + Date.now())}/1200/800`,
                uploadedAt: new Date().toISOString().slice(0, 10),
                uploadedBy: "you@tims.group",
            });

            return next;
        });
    }

    function uploadNewGraphic(file: File) {
        setTicket((prev) => {
            if (!prev) return prev;
            const next = structuredClone(prev);

            next.graphics.unshift({
                id: Date.now(),
                fileName: file.name,
                title: file.name,
                description: "New graphic added to ticket.",
                versions: [
                    {
                        version: "v1",
                        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(file.name + "-" + Date.now())}/1200/800`,
                        uploadedAt: new Date().toISOString().slice(0, 10),
                        uploadedBy: "you@tims.group",
                    },
                ],
                comments: [],
            });

            return next;
        });
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">{ticket.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        {ticket.projectName} • Ticket #{ticket.id}
                    </p>
                    {ticket.description && <p className="text-sm text-muted-foreground">{ticket.description}</p>}
                </div>

                <UploadNewVersionDialog
                    ticket={ticket}
                    onUploadNewVersion={uploadNewVersion}
                    onUploadNewGraphic={uploadNewGraphic}
                />
            </div>

            <Separator />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {ticket.graphics.map((g) => (
                    <TicketGraphicCard
                        key={g.id}
                        graphic={g}
                        onUpdate={(nextGraphic) => {
                            setTicket((prev) => {
                                if (!prev) return prev;
                                const next = structuredClone(prev);
                                const idx = next.graphics.findIndex((x) => x.id === g.id);
                                if (idx >= 0) next.graphics[idx] = nextGraphic;
                                return next;
                            });
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function TicketGraphicCard({
    graphic,
    onUpdate,
}: {
    graphic: TicketGraphic;
    onUpdate: (g: TicketGraphic) => void;
}) {
    const [selectedVersion, setSelectedVersion] = React.useState(graphic.versions[0]?.version ?? "v1");

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

    return (
        <Card className="flex flex-col overflow-hidden">
            <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <CardTitle className="text-base truncate">{graphic.title}</CardTitle>
                        <CardDescription className="truncate">{graphic.fileName}</CardDescription>
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
                                    {v.version} • {v.uploadedAt}
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
                            title="Download"
                            onClick={() => toast.success("Download started (mock)")}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">{graphic.description}</p>

                <div className="relative h-56 w-full overflow-hidden rounded-md border bg-muted">
                    {active?.imageUrl ? (
                        <Image src={active.imageUrl} alt={graphic.title} fill className="object-contain" unoptimized />
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No preview</div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <AddCommentDialog
                        onAdd={(text) => {
                            const c = {
                                id: Date.now(),
                                text,
                                createdAt: new Date().toISOString().slice(0, 10),
                                author: "You",
                                version: selectedVersion,
                            };
                            onUpdate({ ...graphic, comments: [c, ...graphic.comments] });
                        }}
                    />
                    <CommentsDialog comments={graphic.comments} />
                </div>
            </CardContent>
        </Card>
    );
}