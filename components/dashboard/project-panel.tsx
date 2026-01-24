"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Project } from "./build-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  projects: Project[];
  selectedProjectId: number | null;
  onSelectProject: (id: number) => void;
  onCreated: (newProjectId: number) => Promise<void>;
};

export default function ProjectPanel({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(
    () => projects.find(p => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  async function createProject() {
    setErr(null);
    if (!name.trim() || !slug.trim()) {
      setErr("Name and slug are required");
      return;
    }

    try {
      setBusy(true);
      const created = await apiFetch<Project>("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });

      setName("");
      setSlug("");
      await onCreated(created.id);
      onSelectProject(created.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* List */}
        <div className="space-y-2">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className={[
                    "rounded-md border px-3 py-2 text-left text-sm hover:bg-muted transition",
                    selectedProjectId === p.id ? "border-primary" : "",
                  ].join(" ")}
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.slug}</div>
                </button>
              ))}
            </div>
          )}
          {selected && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-medium">{selected.name}</span>
            </p>
          )}
        </div>

        {/* Create */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="text-sm font-medium">Create project</div>

          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="PGE Diagnosis" />
          </div>

          <div className="space-y-1">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="pge-diagnosis" />
            <p className="text-xs text-muted-foreground">Use lowercase + hyphens.</p>
          </div>

          {err && <p className="text-sm text-destructive">{err}</p>}

          <Button onClick={createProject} disabled={busy}>
            {busy ? "Creating..." : "Create"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
