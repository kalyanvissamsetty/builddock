"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { apiFetch } from "@/components/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Role } from "@/components/lib/auth";

type User = {
  id: number;
  email: string;
  role: Role | string;
};

const ROLES = ["DEV", "QA", "VIEWER"] as const;
const PAGE_SIZES = [5, 10, 20,] as const;

function normalize(str: string) {
  return str.trim().toLowerCase();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function PromoteUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editedRoles, setEditedRoles] = useState<Record<number, Role>>({});
  const [loading, setLoading] = useState(false);

  // Search + pagination state
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(5);
  const [page, setPage] = useState(1);

  // Debounced search input for performance on large lists
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(t);
  }, [query]);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      const data = await apiFetch<User[]>("/api/admin/users");

      // If you truly never want ADMIN here, keep this filter.
      // (Your old UI had "isAdmin" checks but also filtered them out.)
      const nonAdminUsers = data.filter((u) => u.role !== "ADMIN");

      // Optional: stable ordering for consistent paging
      nonAdminUsers.sort((a, b) => a.email.localeCompare(b.email));

      setUsers(nonAdminUsers);
    }

    load();
  }, []);

  function onRoleChange(userId: number, role: Role) {
    setEditedRoles((prev) => ({
      ...prev,
      [userId]: role,
    }));
  }

  const filteredUsers = useMemo(() => {
    const q = normalize(debouncedQuery);
    if (!q) return users;

    // Optimized: single pass, simple substring match
    return users.filter((u) => normalize(u.email).includes(q));
  }, [users, debouncedQuery]);

  // Reset page when filters / page size changes
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, pageSize]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = clamp(page, 1, totalPages);

  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const modifiedCount = useMemo(() => {
    let count = 0;
    for (const u of users) {
      const pending = editedRoles[u.id];
      if (pending && pending !== u.role) count++;
    }
    return count;
  }, [editedRoles, users]);

  async function saveChanges() {
    setLoading(true);

    // Only PATCH rows that actually changed
    const changes: Array<{ userId: number; role: Role }> = [];
    for (const [userIdStr, role] of Object.entries(editedRoles)) {
      const userId = Number(userIdStr);
      const current = users.find((u) => u.id === userId);
      if (!current) continue;
      if (role && role !== current.role) {
        changes.push({ userId, role });
      }
    }

    try {
      for (const c of changes) {
        await apiFetch(`/api/admin/users/${c.userId}/role`, {
          method: "PATCH",
          body: JSON.stringify({ role: c.role }),
        });
      }

      setEditedRoles({});

      const refreshed = await apiFetch<User[]>("/api/admin/users");
      const nonAdminUsers = refreshed.filter((u) => u.role !== "ADMIN");
      nonAdminUsers.sort((a, b) => a.email.localeCompare(b.email));
      setUsers(nonAdminUsers);
    } finally {
      setLoading(false);
    }
  }

  function goToPage(next: number) {
    startTransition(() => {
      setPage(clamp(next, 1, totalPages));
    });
  }

  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="h-full flex flex-col min-h-0 max-w-5xl mx-auto">
      {/* Header + search (fixed) */}
      <div className="space-y-4 pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">User Role Management</h1>
            <p className="text-sm text-muted-foreground">
              {totalItems === 0
                ? "No users found."
                : `Showing ${pageStart}–${pageEnd} of ${totalItems}`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-72">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by email..."
              />
            </div>

            <Select
              value={String(pageSize)}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onValueChange={(v) => setPageSize(Number(v) as any)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
              }}
              disabled={!query}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Content area that can shrink (key for scroll) */}
      <div className="flex flex-col min-h-0 flex-1 gap-4">
        {/* ✅ Users list box: fixed region, scroll inside */}
        <div className="border rounded-md overflow-hidden flex-1 min-h-0">
          <div className="h-full overflow-y-auto divide-y">
            {pagedUsers.map((u) => {
              const pendingRole = editedRoles[u.id];
              const isModified = !!pendingRole && pendingRole !== u.role;
              const isAdmin = u.role === "ADMIN";

              return (
                <div
                  key={u.id}
                  className={`flex items-center justify-between p-4 ${isModified ? "bg-yellow-50" : ""
                    }`}
                >
                  <div>
                    <p className="font-medium">{u.email}</p>
                    {isAdmin && <Badge variant="destructive">ADMIN</Badge>}
                    {isModified && (
                      <p className="text-xs text-yellow-600">Unsaved changes</p>
                    )}
                  </div>

                  <Select
                    disabled={isAdmin}
                    value={(pendingRole ?? u.role) as string}
                    onValueChange={(role) => onRoleChange(u.id, role as Role)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}

            {pagedUsers.length === 0 && (
              <div className="p-6 text-sm text-muted-foreground">
                No users match your search.
              </div>
            )}
          </div>
        </div>

        {/* Pagination (fixed, always visible) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
            {isPending ? " (updating...)" : ""}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => goToPage(1)} disabled={currentPage === 1}>
              First
            </Button>
            <Button variant="outline" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              Prev
            </Button>
            <Button variant="outline" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
            </Button>
            <Button variant="outline" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
              Last
            </Button>
          </div>
        </div>

        {/* Save bar (fixed, always visible) */}
        <div className="flex justify-end gap-3">
          {modifiedCount > 0 && (
            <p className="text-sm text-muted-foreground self-center">
              You have {modifiedCount} unsaved change{modifiedCount === 1 ? "" : "s"}
            </p>
          )}

          <Button disabled={loading || modifiedCount === 0} onClick={saveChanges}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}