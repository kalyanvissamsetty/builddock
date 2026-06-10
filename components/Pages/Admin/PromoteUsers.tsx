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
import { Checkbox } from "@/components/ui/checkbox";
import { ReviewDomain } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/useAuth";
import { DOMAIN_LABELS, useSelectedDomain } from "@/components/auth/domain";
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

type User = {
  id: number;
  email: string;
  role: string;
  module?: ReviewDomain;
};

type RoleOption = {
  id: number;
  key: string;
  displayName: string;
  module: ReviewDomain;
};

const PAGE_SIZES = [5, 10, 20] as const;
const DELETE_CONFIRMATION_SESSION_KEY = "skip-user-delete-confirmation";

function normalize(str: string) {
  return str.trim().toLowerCase();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function PromoteUsersPage() {
  const { me } = useAuth();
  const { selectedDomain } = useSelectedDomain(me);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [editedRoles, setEditedRoles] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(5);
  const [page, setPage] = useState(1);

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);
  const [dontAskAgainChecked, setDontAskAgainChecked] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedValue = window.sessionStorage.getItem(DELETE_CONFIRMATION_SESSION_KEY);
    setSkipDeleteConfirm(savedValue === "true");
  }, []);

  const [isPending, startTransition] = useTransition();

  async function loadRoles() {
    const data = await apiFetch<RoleOption[]>(`/api/admin/roles?module=${selectedDomain}`);
    setRoles(Array.isArray(data) ? data : []);
  }

  async function loadUsers() {
    const data = await apiFetch<User[]>(`/api/admin/users?module=${selectedDomain}`);
    const nonAdminUsers = data.filter((u) => u.role !== "ADMIN" && u.id !== me?.id);
    nonAdminUsers.sort((a, b) => a.email.localeCompare(b.email));
    setUsers(nonAdminUsers);
  }

  useEffect(() => {
    setUsers([]);
    setRoles([]);
    setEditedRoles({});
    setPage(1);
    loadRoles();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomain]);

  function onRoleChange(userId: number, role: string) {
    setEditedRoles((prev) => ({
      ...prev,
      [userId]: role,
    }));
  }

  async function deleteUser(user: User, options?: { skippedConfirmation?: boolean }) {
    try {
      setDeletingUserId(user.id);

      await apiFetch(`/api/admin/users/${user.id}?module=${selectedDomain}`, {
        method: "DELETE",
      });

      setUsers((prev) => prev.filter((existingUser) => existingUser.id !== user.id));

      setEditedRoles((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });

      toast.success(selectedDomain === "GRAPHICS" ? `Graphics access removed: ${user.email}` : `User deleted: ${user.email}`);
    } catch (error) {
      console.error("Failed to delete user", error);
      toast.error("Failed to delete user");
    } finally {
      setDeletingUserId(null);
      setDeleteDialogOpen(false);
      setSelectedUserForDelete(null);
      setDontAskAgainChecked(false);
    }
  }

  function handleDeleteClick(user: User) {
    if (user.id === me?.id) return;

    if (skipDeleteConfirm) {
      deleteUser(user, { skippedConfirmation: true });
      return;
    }

    setSelectedUserForDelete(user);
    setDontAskAgainChecked(false);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!selectedUserForDelete) return;

    if (dontAskAgainChecked && typeof window !== "undefined") {
      window.sessionStorage.setItem(DELETE_CONFIRMATION_SESSION_KEY, "true");
      setSkipDeleteConfirm(true);
    }

    await deleteUser(selectedUserForDelete);
  }

  const filteredUsers = useMemo(() => {
    const q = normalize(debouncedQuery);
    if (!q) return users;
    return users.filter((u) => normalize(u.email).includes(q));
  }, [users, debouncedQuery]);

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

    const changes: Array<{ userId: number; role: string }> = [];
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
          body: JSON.stringify({ role: c.role, module: selectedDomain }),
        });
      }

      setEditedRoles({});
      await loadUsers();
      toast.success("User roles updated successfully.");
    } catch (error) {
      console.error("Failed to save role changes", error);
      toast.error("Failed to save role changes");
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
    <>
      <div className="h-full flex flex-col min-h-0 max-w-5xl mx-auto">
        <div className="space-y-4 pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">User Role Management</h1>
              <p className="text-sm text-muted-foreground">
                {totalItems === 0
                  ? `No ${DOMAIN_LABELS[selectedDomain]} users found.`
                  : `Showing ${pageStart}–${pageEnd} of ${totalItems} ${DOMAIN_LABELS[selectedDomain]} user(s)`}
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
                onValueChange={(v) =>
                  setPageSize(Number(v) as (typeof PAGE_SIZES)[number])
                }
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

        <div className="flex flex-col min-h-0 flex-1 gap-4">
          <div className="border rounded-md overflow-hidden flex-1 min-h-0">
            <div className="h-full overflow-y-auto divide-y">
              {pagedUsers.map((u) => {
                const pendingRole = editedRoles[u.id];
                const isModified = !!pendingRole && pendingRole !== u.role;
                const isAdmin = u.role === "ADMIN";
                const isDeleting = deletingUserId === u.id;

                return (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between gap-4 p-4 ${isModified ? "bg-yellow-50" : ""
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium break-all">{u.email}</p>
                      {isAdmin && <Badge variant="destructive">ADMIN</Badge>}
                      {isModified && (
                        <p className="text-xs text-yellow-600">Unsaved changes</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        disabled={isAdmin || isDeleting}
                        value={(pendingRole ?? u.role) as string}
                        onValueChange={(role) => onRoleChange(u.id, role)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.key}>
                              {r.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(u)}
                        disabled={isDeleting || loading}
                      >
                        {isDeleting ? (selectedDomain === "GRAPHICS" ? "Removing..." : "Deleting...") : (selectedDomain === "GRAPHICS" ? "Remove" : "Delete")}
                      </Button>
                    </div>
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
              {isPending ? " (updating...)" : ""}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              <Button
                variant="outline"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          </div>

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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedDomain === "GRAPHICS" ? "Remove graphics access?" : "Delete user?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUserForDelete ? (
                <>
                  Are you sure you want to {selectedDomain === "GRAPHICS" ? "remove graphics access for" : "delete"}{" "}
                  <span className="font-medium text-foreground">
                    {selectedUserForDelete.email}
                  </span>
                  ? {selectedDomain === "GRAPHICS" ? "They will remain in other domains they can access." : "This action cannot be undone."}
                </>
              ) : (
                selectedDomain === "GRAPHICS" ? "Are you sure you want to remove graphics access for this user?" : "Are you sure you want to delete this user?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show-delete-confirm-again"
              checked={dontAskAgainChecked}
              onCheckedChange={(checked) => setDontAskAgainChecked(checked === true)}
              disabled={!!deletingUserId}
            />
            <label
              htmlFor="dont-show-delete-confirm-again"
              className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Don’t show this confirmation again for this session
            </label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={!!deletingUserId}
              onClick={() => {
                setDontAskAgainChecked(false);
                setSelectedUserForDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={!!deletingUserId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingUserId ? (selectedDomain === "GRAPHICS" ? "Removing..." : "Deleting...") : (selectedDomain === "GRAPHICS" ? "Remove" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
