"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Environment, Project } from "./build-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  project: Project | null;
  environments: Environment[];
  selectedEnvId: number | null;
  onSelectEnv: (id: number) => void;
  onCreated: (newEnvId: number) => Promise<void>;
};

export default function EnvironmentPanel({
  project,
  environments,
  selectedEnvId,
  onSelectEnv,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(
    () => environments.find(e => e.id === selectedEnvId) ?? null,
    [environments, selectedEnvId]
  );

  async function createEnv() {
    setErr(null);
    if (!project) {
      setErr("Select a project first");
      return;
    }
    if (!name.trim() || !slug.trim()) {
      setErr("Name and slug are required");
      return;
    }

    try {
      setBusy(true);
      const created = await apiFetch<Environment>(`/projects/${project.id}/environments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });

      setName("");
      setSlug("");
      await onCreated(created.id);
      onSelectEnv(created.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={!project ? "opacity-60" : ""}>
      <CardHeader>
        <CardTitle>Environments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!project ? (
          <p className="text-sm text-muted-foreground">Select a project to manage environments.</p>
        ) : (
          <>
            {/* List */}
            <div className="space-y-2">
              {environments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No environments yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {environments.map(e => (
                    <button
                      key={e.id}
                      onClick={() => onSelectEnv(e.id)}
                      className={[
                        "rounded-md border px-3 py-2 text-left text-sm hover:bg-muted transition",
                        selectedEnvId === e.id ? "border-primary" : "",
                      ].join(" ")}
                    >
                      <div className="font-medium">{e.name}</div>
                      <div className="text-xs text-muted-foreground">{e.slug}</div>
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
              <div className="text-sm font-medium">Create environment</div>

              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Testing" />
              </div>

              <div className="space-y-1">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="testing" />
              </div>

              {err && <p className="text-sm text-destructive">{err}</p>}
              <Button onClick={createEnv} disabled={busy}>
                {busy ? "Creating..." : "Create"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
