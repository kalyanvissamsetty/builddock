"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/components/lib/api";
import { useAuth } from "@/components/auth/useAuth";
import { getDomainRole } from "@/components/auth/domain";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Project = { id: number; name: string; slug: string };
type GraphicTicketStatus = "OPEN" | "IN_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "CLOSED";
type TicketAccess = { canView: boolean; accessScope: "ASSIGNED" | "ALL" | null };
type Ticket = {
    id: number;
    title: string;
    description?: string | null;
    status?: GraphicTicketStatus;
    createdAt: string;
    graphicData?: { project?: Project };
    currentUserTicketAccess?: TicketAccess;
    _count?: { graphics: number };
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

function ClippedDescription({
    text,
    maxChars = 125,
}: {
    text?: string | null;
    maxChars?: number;
}) {
    if (!text) return null;

    const normalized = text.trim();
    const visibleText = normalized.length > maxChars ? `${normalized.slice(0, maxChars).trimEnd()}...` : normalized;

    return (
        <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{visibleText}</p>
    );
}

export default function ViewTicketsPage() {
    const { me } = useAuth();
    const graphicsRole = me ? getDomainRole(me, "GRAPHICS") : null;
    const canUpdateTicketStatus =
        graphicsRole === "ADMIN" ||
        graphicsRole === "MANAGER" ||
        graphicsRole === "DESIGNER" ||
        graphicsRole === "REVIEWER";

    const [projectId, setProjectId] = React.useState<string>("ALL");
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [updatingTicketId, setUpdatingTicketId] = React.useState<number | null>(null);
    const [ticketToDelete, setTicketToDelete] = React.useState<Ticket | null>(null);
    const [deletingTicket, setDeletingTicket] = React.useState(false);

    async function loadData() {
        setLoading(true);
        try {
            const [projectsData, ticketsData] = await Promise.all([
                apiFetch<Project[]>("/api/graphics/projects"),
                apiFetch<Ticket[]>("/api/graphics/tickets"),
            ]);
            setProjects(Array.isArray(projectsData) ? projectsData : []);
            setTickets(Array.isArray(ticketsData) ? ticketsData : []);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to load tickets");
            setProjects([]);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        loadData();
    }, []);

    const projectById = React.useMemo(() => {
        const m = new Map<number, Project>();
        projects.forEach((p) => m.set(p.id, p));
        return m;
    }, [projects]);

    const filtered = React.useMemo(() => {
        if (projectId === "ALL") return tickets;
        const pid = Number(projectId);
        return tickets.filter((t) => t.graphicData?.project?.id === pid);
    }, [projectId, tickets]);

    async function updateTicketStatus(ticketId: number, status: GraphicTicketStatus) {
        const current = tickets.find((ticket) => ticket.id === ticketId);
        if (current?.status === status) return;

        setUpdatingTicketId(ticketId);
        try {
            const updated = await apiFetch<Ticket>(`/api/graphics/tickets/${ticketId}`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            });

            setTickets((currentTickets) => currentTickets.map((ticket) => (
                ticket.id === ticketId ? { ...ticket, status: updated.status ?? status } : ticket
            )));
            toast.success("Ticket status updated");
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to update ticket status");
        } finally {
            setUpdatingTicketId(null);
        }
    }

    async function deleteTicket() {
        if (!ticketToDelete || deletingTicket) return;

        setDeletingTicket(true);
        try {
            await apiFetch(`/api/graphics/tickets/${ticketToDelete.id}`, { method: "DELETE" });
            setTickets((current) => current.filter((ticket) => ticket.id !== ticketToDelete.id));
            toast.success("Ticket deleted");
            setTicketToDelete(null);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to delete ticket");
        } finally {
            setDeletingTicket(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Tickets</h1>
                <p className="text-sm text-muted-foreground">
                    View tickets from graphics projects you can access.
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
                            {projects.map((p) => (
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

                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{filtered.length} ticket(s)</Badge>
                    <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading tickets...</p>
                ) : filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tickets found.</p>
                ) : filtered.map((t) => {
                    const p = t.graphicData?.project ? projectById.get(t.graphicData.project.id) ?? t.graphicData.project : null;
                    const canUpdateStatus = canUpdateTicketStatus && t.currentUserTicketAccess?.canView !== false;
                    return (
                        <Card key={t.id} className="flex h-full flex-col hover:shadow-md transition">
                            <CardHeader className="space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 space-y-1">
                                        <CardTitle className="truncate text-base">{t.title}</CardTitle>
                                        <CardDescription className="truncate">
                                            {p?.name || "Unknown project"} • {new Date(t.createdAt).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    {canUpdateStatus ? (
                                        <Select
                                            value={t.status ?? "OPEN"}
                                            onValueChange={(value) => updateTicketStatus(t.id, value as GraphicTicketStatus)}
                                            disabled={updatingTicketId === t.id}
                                        >
                                            <SelectTrigger className="h-8 w-[150px] shrink-0">
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
                                    ) : (
                                        <Badge variant="outline" className="shrink-0">
                                            {statusLabel(t.status)}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-1 flex-col space-y-3">
                                <ClippedDescription text={t.description} />
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{t._count?.graphics ?? 0} graphic(s)</Badge>
                                </div>
                                <div className="mt-auto flex gap-2 pt-1">
                                    <Button asChild className="flex-1">
                                        <Link href={`/tickets/${t.id}`}>Open ticket</Link>
                                    </Button>
                                    
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <AlertDialog open={Boolean(ticketToDelete)} onOpenChange={(open) => !open && !deletingTicket && setTicketToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete ticket?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete <span className="font-medium text-foreground">{ticketToDelete?.title}</span>, including its graphics,
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
