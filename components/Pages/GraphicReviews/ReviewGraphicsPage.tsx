"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Download, MessageSquarePlus, MessageSquareText, X, Expand } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Comment = {
    id: number;
    text: string;
    createdAt: string; // YYYY-MM-DD
    author: string;
    version: string;
};

type GraphicVersion = {
    version: string;
    imageUrl: string;
};

type GraphicItem = {
    id: number;
    title: string;
    subtitle: string;
    description: string;

    project: { name: string; slug: string };
    environment: { name: string; slug: string };

    versions: GraphicVersion[];
    comments: Comment[];
};

const MOCK_GRAPHICS: GraphicItem[] = [
    {
        id: 1,
        title: "Homepage Banner",
        subtitle: "Landing page hero",
        description: "New banner for training portal landing page. Review alignment + contrast.",
        project: { name: "PG&E Substation", slug: "pge-substation" },
        environment: { name: "Testing", slug: "testing" },
        versions: [
            { version: "v1", imageUrl: "https://images.pexels.com/photos/35658798/pexels-photo-35658798/free-photo-of-idyllic-alpine-meadow-with-wooden-cabins.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500" },
            { version: "v2", imageUrl: "https://picsum.photos/seed/banner2/900/550" },
            { version: "v3", imageUrl: "https://picsum.photos/seed/banner3/900/550" },
        ],
        comments: [
            { id: 11, text: "Increase contrast for the headline.", createdAt: "2026-04-20", author: "Kalyan", version: "v1" },
            { id: 12, text: "Logo looks slightly blurry on mobile.", createdAt: "2026-04-21", author: "QA Team", version: "v2" },
            { id: 13, text: "Looks good now.", createdAt: "2026-04-25", author: "Manager", version: "v3" },
        ],
    },
    {
        id: 2,
        title: "Safety Poster",
        subtitle: "Poster used in review page",
        description: "Poster graphic used inside dashboard. Check spacing near footer.",
        project: { name: "Mosaic Viewer", slug: "mosaic-viewer" },
        environment: { name: "QA", slug: "qa" },
        versions: [
            { version: "v1", imageUrl: "https://picsum.photos/seed/poster1/900/550" },
            { version: "v2", imageUrl: "https://picsum.photos/seed/poster2/900/550" },
        ],
        comments: [
            { id: 21, text: "Spacing near footer needs more padding.", createdAt: "2026-04-22", author: "Manager", version: "v1" },
            { id: 22, text: "Footer fixed, check typography.", createdAt: "2026-04-23", author: "QA Team", version: "v2" },
        ],
    },
    {
        id: 3,
        title: "Checklist Icon Set",
        subtitle: "Small UI icons",
        description: "Icon refresh for checklist module. Verify consistency and thickness.",
        project: { name: "PG&E Substation", slug: "pge-substation" },
        environment: { name: "Production", slug: "prod" },
        versions: [
            { version: "v1", imageUrl: "https://picsum.photos/seed/icons1/900/550" },
            { version: "v2", imageUrl: "https://picsum.photos/seed/icons2/900/550" },
        ],
        comments: [],
    },
];

function AddCommentDialog({ onSubmit }: { onSubmit: (text: string) => void }) {
    const [open, setOpen] = React.useState(false);
    const [text, setText] = React.useState("");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquarePlus className="h-4 w-4" />
                    Add comment
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a comment</DialogTitle>
                    <DialogDescription>Leave feedback for this graphic.</DialogDescription>
                </DialogHeader>

                <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your comment..." rows={5} />

                <DialogFooter>
                    <Button
                        onClick={() => {
                            const trimmed = text.trim();
                            if (!trimmed) return;
                            onSubmit(trimmed);
                            setText("");
                            setOpen(false);
                        }}
                    >
                        Submit
                    </Button>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function FullscreenImageDialog({
    title,
    imageUrl,
}: {
    title: string;
    imageUrl: string;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0" title="Fullscreen">
                    <Expand className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Preview in full screen</DialogDescription>
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

function ViewCommentsDialog({ comments }: { comments: Comment[] }) {
    const [author, setAuthor] = React.useState("");
    const [version, setVersion] = React.useState<string>("ALL");
    const [sort, setSort] = React.useState<"NEWEST" | "OLDEST">("NEWEST");

    const versions = React.useMemo(() => {
        const set = new Set<string>();
        comments.forEach((c) => set.add(c.version));
        return Array.from(set.values()).sort();
    }, [comments]);

    const filtered = React.useMemo(() => {
        const a = author.trim().toLowerCase();
        const list = comments.filter((c) => {
            if (a && !c.author.toLowerCase().includes(a)) return false;
            if (version !== "ALL" && c.version !== version) return false;
            return true;
        });

        list.sort((x, y) => {
            const dx = new Date(x.createdAt).getTime();
            const dy = new Date(y.createdAt).getTime();
            return sort === "NEWEST" ? dy - dx : dx - dy;
        });

        return list;
    }, [comments, author, version, sort]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-2">
                    <MessageSquareText className="h-4 w-4" />
                    View comments
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>All comments</DialogTitle>
                    <DialogDescription>Filter by time, author, and version.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Author</p>
                        <Input
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Search author..."
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Version</p>
                        <Select value={version} onValueChange={setVersion}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All versions" />
                            </SelectTrigger>
                            <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                <SelectItem value="ALL">All</SelectItem>
                                {versions.map((v) => (
                                    <SelectItem key={v} value={v}>
                                        {v}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Time</p>
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
                </div>

                <Separator />

                <ScrollArea className="h-72 pr-3">
                    <div className="space-y-3">
                        {filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No comments match the filters.</p>
                        ) : (
                            filtered.map((c) => (
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
                    <Button
                        variant="outline"
                        onClick={() => {
                            setAuthor("");
                            setVersion("ALL");
                            setSort("NEWEST");
                        }}
                    >
                        Reset filters
                    </Button>
                    <Button variant="outline">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function GraphicCard({
    item,
    onUpdate,
}: {
    item: GraphicItem;
    onUpdate: (next: GraphicItem) => void;
}) {
    const [selectedVersion, setSelectedVersion] = React.useState(item.versions[0]?.version ?? "v1");

    React.useEffect(() => {
        if (!item.versions.some((v) => v.version === selectedVersion)) {
            setSelectedVersion(item.versions[0]?.version ?? "v1");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.versions]);

    const active = React.useMemo(() => {
        return item.versions.find((v) => v.version === selectedVersion) ?? item.versions[0];
    }, [item.versions, selectedVersion]);

    return (
        <Card className="flex flex-col overflow-hidden">
            <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <CardTitle className="text-base truncate">{item.title}</CardTitle>
                    </div>

                    <Badge variant="secondary">{selectedVersion}</Badge>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Version" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                            {item.versions.map((v) => (
                                <SelectItem key={v.version} value={v.version}>
                                    {v.version}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                        <FullscreenImageDialog title={`${item.title} (${selectedVersion})`} imageUrl={active?.imageUrl || ""} />

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                                toast.success("Download started (mock)");
                            }}
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">{item.description}</p>

                {/* Responsive preview for any image size/aspect ratio */}
                <div className="relative h-56 w-full overflow-hidden rounded-md border bg-muted">
                    {active?.imageUrl ? (
                        <Image src={active.imageUrl} alt={item.title} fill className="object-contain" unoptimized />
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No preview</div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <AddCommentDialog
                        onSubmit={(text) => {
                            const newComment: Comment = {
                                id: Date.now(),
                                text,
                                createdAt: new Date().toISOString().slice(0, 10),
                                author: "You",
                                version: selectedVersion,
                            };

                            onUpdate({ ...item, comments: [newComment, ...item.comments] });
                            toast.success("Comment added (mock)");
                        }}
                    />

                    <ViewCommentsDialog comments={item.comments} />
                </div>
            </CardContent>
        </Card>
    );
}

export default function ReviewGraphicsPage() {
    const [items, setItems] = React.useState<GraphicItem[]>(MOCK_GRAPHICS);

    // Only Project filter (compact)
    const [projectSlug, setProjectSlug] = React.useState<string>("ALL");

    const projectOptions = React.useMemo(() => {
        const map = new Map<string, string>();
        for (const i of items) map.set(i.project.slug, i.project.name);
        return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
    }, [items]);

    const filtered = React.useMemo(() => {
        return items.filter((i) => {
            if (projectSlug !== "ALL" && i.project.slug !== projectSlug) return false;
            return true;
        });
    }, [items, projectSlug]);

    const activeProjectLabel = React.useMemo(() => {
        if (projectSlug === "ALL") return "All projects";
        return projectOptions.find((x) => x.slug === projectSlug)?.name || projectSlug;
    }, [projectSlug, projectOptions]);

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold">Graphics Review</h1>
                <p className="text-sm text-muted-foreground">
                    Mock list of uploaded graphics with project filter + version switching + comments.
                </p>
            </div>

            {/* Compact Project Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Project</p>
                    <Select value={projectSlug} onValueChange={setProjectSlug}>
                        <SelectTrigger className="w-[260px]">
                            <SelectValue placeholder="All projects" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                            <SelectItem value="ALL">All projects</SelectItem>
                            {projectOptions.map((p) => (
                                <SelectItem key={p.slug} value={p.slug}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setProjectSlug("ALL")}
                        disabled={projectSlug === "ALL"}
                    >
                        <X className="h-4 w-4" />
                        Clear
                    </Button>
                </div>

                <div className="flex items-center gap-2 justify-between sm:justify-end">
                    <Badge variant="outline">{activeProjectLabel}</Badge>
                    <Badge variant="secondary">{filtered.length} item(s)</Badge>
                </div>
            </div>

            <Separator />

            {/* Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {filtered.map((g) => (
                    <GraphicCard
                        key={g.id}
                        item={g}
                        onUpdate={(next) => setItems((prev) => prev.map((x) => (x.id === next.id ? next : x)))}
                    />
                ))}
            </div>
        </div>
    );
}