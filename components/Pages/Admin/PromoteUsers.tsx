"use client";
type User = {
  id: number;
  email: string;
  role: string;
};

import { useEffect, useState } from "react";
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
import { Role } from "@/components/lib/auth";

const ROLES = ["DEV", "QA", "VIEWER"] as const;

export default function PromoteUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editedRoles, setEditedRoles] = useState<Record<number, Role>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await apiFetch<User[]>("/api/admin/users");

      const nonAdminUsers = data.filter((u) => u.role !== "ADMIN");

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

  async function saveChanges() {
    setLoading(true);

    for (const [userId, role] of Object.entries(editedRoles)) {
      await apiFetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
    }

    setEditedRoles({});
    const refreshed = await apiFetch<User[]>("/api/admin/users");
    setUsers(refreshed);
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">User Role Management</h1>

      <div className="border rounded-md divide-y">
        {users.map((u) => {
          const pendingRole = editedRoles[u.id];
          const isModified = pendingRole && pendingRole !== u.role;
          const isAdmin = u.role === "ADMIN";

          return (
            <div
              key={u.id}
              className={`flex items-center justify-between p-4 ${
                isModified ? "bg-yellow-50" : ""
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
                value={pendingRole ?? u.role}
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
      </div>

      <div className="flex justify-end gap-3">
        {Object.keys(editedRoles).length > 0 && (
          <p className="text-sm text-muted-foreground self-center">
            You have unsaved changes
          </p>
        )}

        <Button
          disabled={loading || Object.keys(editedRoles).length === 0}
          onClick={saveChanges}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
