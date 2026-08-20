/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { KeyRound, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/components/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type User = {
    id: number;
    email: string;
    name?: string | null;
    role?: string | null;
};

type Project = {
    id: number;
    name: string;
    slug: string;
};

type Ticket = {
    id: number;
    title: string;
    status?: string;
    graphicData?: { project?: Project };
};

type GraphicTicketAccess = {
    id: number;
    userId: number;
    ticketId: number;
    user?: User;
    ticket?: Ticket;
    assignedBy?: User | null;
    createdAt?: string;
};

function userLabel(user: User) {
    return user.name ? `${user.name} (${user.email})` : user.email;
}

export default function GraphicProjectAccessPage() {
    const [users, setUsers] = React.useState<User[]>([]);
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [assignments, setAssignments] = React.useState<GraphicTicketAccess[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [deletingId, setDeletingId] = React.useState<number | null>(null);

    const [userId, setUserId] = React.useState("");
    const [projectId, setProjectId] = React.useState("");
    const [ticketId, setTicketId] = React.useState("");
    const [assignmentUserFilter, setAssignmentUserFilter] = React.useState("ALL");

    async function loadData() {
        setLoading(true);
        try {
            const [usersData, projectsData, accessData] = await Promise.all([
                apiFetch<User[]>("/api/graphics/assignable-users"),
                apiFetch<Project[]>("/api/graphics/projects"),
                apiFetch<GraphicTicketAccess[]>("/api/graphics/ticket-access"),
            ]);

            setUsers(Array.isArray(usersData) ? usersData.filter((user) => user.role === "REVIEWER" || user.role === "DESIGNER") : []);
            setProjects(Array.isArray(projectsData) ? projectsData : []);
            setAssignments(Array.isArray(accessData) ? accessData : []);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to load ticket access data");
            setUsers([]);
            setProjects([]);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }

    async function loadTicketsForProject(nextProjectId: string) {
        setProjectId(nextProjectId);
        setTicketId("");
        setTickets([]);
        if (!nextProjectId) return;

        try {
            const ticketData = await apiFetch<Ticket[]>(`/api/graphics/tickets?projectId=${nextProjectId}`);
            setTickets(Array.isArray(ticketData) ? ticketData : []);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to load project tickets");
            setTickets([]);
        }
    }

    React.useEffect(() => {
        loadData();
    }, []);

    async function assignAccess() {
        const selectedUserId = Number(userId);
        const selectedTicketId = Number(ticketId);

        if (!selectedUserId || !selectedTicketId) {
            toast.error("Select user, project, and ticket");
            return;
        }

        setSaving(true);
        try {
            const saved = await apiFetch<GraphicTicketAccess>("/api/graphics/ticket-access", {
                method: "POST",
                body: JSON.stringify({
                    userId: selectedUserId,
                    ticketId: selectedTicketId,
                }),
            });

            setAssignments((current) => {
                const withoutExisting = current.filter(
                    (item) => !(item.userId === saved.userId && item.ticketId === saved.ticketId),
                );
                return [saved, ...withoutExisting];
            });
            setUserId("");
            setProjectId("");
            setTicketId("");
            setTickets([]);
            toast.success("Ticket access saved");
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to save ticket access");
        } finally {
            setSaving(false);
        }
    }

    async function removeAccess(id: number) {
        setDeletingId(id);
        try {
            await apiFetch(`/api/graphics/ticket-access/${id}`, { method: "DELETE" });
            setAssignments((current) => current.filter((item) => item.id !== id));
            toast.success("Ticket access removed");
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to remove ticket access");
        } finally {
            setDeletingId(null);
        }
    }

    const selectedUser = users.find((user) => String(user.id) === userId);
    const selectedProject = projects.find((project) => String(project.id) === projectId);
    const selectedTicket = tickets.find((ticket) => String(ticket.id) === ticketId);
    const selectedAssignmentUser = users.find((user) => String(user.id) === assignmentUserFilter) ?? null;
    const filteredAssignments = React.useMemo(() => {
        if (assignmentUserFilter === "ALL") return assignments;
        const filteredUserId = Number(assignmentUserFilter);
        return assignments.filter((assignment) => assignment.userId === filteredUserId);
    }, [assignmentUserFilter, assignments]);

    return (
        <div className="w-full space-y-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Assign Tickets</h1>
                    <p className="text-sm text-muted-foreground">
                        Assign individual tickets to reviewers and designers.
                    </p>
                </div>
                <Button variant="outline" onClick={loadData} disabled={loading} className="w-fit gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr] space-y-8">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5" />
                            Assign Ticket Access
                        </CardTitle>
                        <CardDescription>Select user, project, then ticket. Role controls what the user can do.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>User</Label>
                                <Combobox
                                    items={users}
                                    value={selectedUser ?? null}
                                    onValueChange={(user) => setUserId(user ? String(user.id) : "")}
                                    itemToStringLabel={userLabel}
                                >
                                    <ComboboxInput
                                        placeholder={loading ? "Loading users..." : "Search reviewer/designer"}
                                        disabled={loading || saving}
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
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Graphics project</Label>
                                    <Combobox
                                        items={projects}
                                        value={selectedProject ?? null}
                                        onValueChange={(project) => loadTicketsForProject(project ? String(project.id) : "")}
                                        itemToStringLabel={(project) => project.name}
                                    >
                                        <ComboboxInput
                                            placeholder={loading ? "Loading projects..." : "Search project"}
                                            disabled={loading || saving}
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
                                </div>

                                <div className="space-y-2">
                                    <Label>Ticket</Label>
                                    <Combobox
                                        items={tickets}
                                        value={selectedTicket ?? null}
                                        onValueChange={(ticket) => setTicketId(ticket ? String(ticket.id) : "")}
                                        itemToStringLabel={(ticket) => ticket.title}
                                    >
                                        <ComboboxInput
                                            placeholder={!projectId ? "Select project first" : "Search ticket"}
                                            disabled={!projectId || loading || saving}
                                            showClear
                                            className="w-full"
                                        />
                                        <ComboboxContent>
                                            <ComboboxEmpty>No ticket found.</ComboboxEmpty>
                                            <ComboboxList>
                                                {(ticket) => (
                                                    <ComboboxItem key={ticket.id} value={ticket}>
                                                        <div className="min-w-0">
                                                            <p className="truncate">{ticket.title}</p>
                                                            <p className="truncate text-xs text-muted-foreground">{ticket.status ?? "OPEN"}</p>
                                                        </div>
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>
                            </div>
                        </div>

                        

                        <Button onClick={assignAccess} disabled={!userId || !projectId || !ticketId || saving} className="w-fit gap-2">
                            <KeyRound className="h-4 w-4" />
                            {saving ? "Saving..." : "Save Ticket Access"}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="min-h-[460px]">
                    <CardHeader className="pb-3">
                        <CardTitle>Current Ticket Assignments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex items-center gap-2">
                            <Combobox
                                items={users}
                                value={selectedAssignmentUser}
                                onValueChange={(user) => setAssignmentUserFilter(user ? String(user.id) : "ALL")}
                                itemToStringLabel={userLabel}
                            >
                                <ComboboxInput
                                    placeholder="Filter assignments by user"
                                    disabled={loading}
                                    showClear
                                    className="min-w-0 flex-1"
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
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="shrink-0 px-3"
                                disabled={assignmentUserFilter === "ALL"}
                                onClick={() => setAssignmentUserFilter("ALL")}
                            >
                                Clear
                            </Button>
                        </div>
                        <ScrollArea className="h-[360px] pr-3">
                            {loading ? (
                                <p className="text-sm text-muted-foreground">Loading access...</p>
                            ) : filteredAssignments.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No ticket access assigned yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {filteredAssignments.map((assignment) => (
                                        <div key={assignment.id} className="rounded-md border p-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="font-medium">
                                                        {assignment.user ? (assignment.user.email) : `User ${assignment.userId}`}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {assignment.ticket?.title ?? `Ticket ${assignment.ticketId}`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {assignment.ticket?.graphicData?.project?.name ?? "Unknown project"}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary">Assigned</Badge>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => removeAccess(assignment.id)}
                                                        disabled={deletingId === assignment.id}
                                                        aria-label="Remove ticket access"
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
            </div>
        </div>
    );
}
