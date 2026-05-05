"use client";

import * as React from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

export default function ViewTicketsPage() {
    const [projectId, setProjectId] = React.useState<string>("ALL");

    const projectById = React.useMemo(() => {
        const m = new Map<number, Project>();
        MOCK_PROJECTS.forEach((p) => m.set(p.id, p));
        return m;
    }, []);

    const filtered = React.useMemo(() => {
        if (projectId === "ALL") return MOCK_TICKETS;
        const pid = Number(projectId);
        return MOCK_TICKETS.filter((t) => t.projectId === pid);
    }, [projectId]);

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Tickets</h1>
                <p className="text-sm text-muted-foreground">
                    Mock page: view all tickets + filter by project.
                </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Project</p>
                    <Select value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger className="w-[260px]">
                            <SelectValue placeholder="All projects" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                            <SelectItem value="ALL">All projects</SelectItem>
                            {MOCK_PROJECTS.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" onClick={() => setProjectId("ALL")} disabled={projectId === "ALL"}>
                        Clear
                    </Button>
                </div>

                <Badge variant="secondary">{filtered.length} ticket(s)</Badge>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((t) => {
                    const p = projectById.get(t.projectId);
                    return (
                        <Card key={t.id} className="hover:shadow-md transition">
                            <CardHeader className="space-y-2">
                                <CardTitle className="text-base">{t.title}</CardTitle>
                                <CardDescription className="truncate">
                                    {p?.name || "Unknown project"} • {t.createdAt}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                                <Button asChild className="w-full">
                                    <Link href={`/tickets/${t.id}`}>Open ticket</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}