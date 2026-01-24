"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Environment, Project, Version } from "./build-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  project: Project | null;
  environment: Environment | null;
  versions: Version[];
  selectedVersionId: number | null;
  onSelectVersion: (id: number) => void;
  onCreated: (newVersionId: number) => Promise<void>;
};

export default function VersionPanel({
  project,
  environment,
  versions,
  selectedVersionId,
  onSelectVersion,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(
    () => versions.find(v => v.id === selectedVersionId) ?? null,
    [versions, selectedVersionId]
  );

  async function createVersion() {
    setErr(null);
    if (!project) return setErr("Select a project first");
    if (!environment) return setErr("Select an environment first");
    if (!name.trim()) return setErr("Version name is required");

    try {
      setBusy(true);
      const created = await apiFetch<Version>(
        `/projects/${project.id}/environments/${environment.id}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        }
      );

      setName("");
      await onCreated(created.id);
      onSelectVersion(created.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={!environment ? "opacity-60" : ""}>
      <CardHeader>
        <CardTitle>Versions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!project || !environment ? (
          <p className="text-sm text-muted-foreground">
            Select a project and environment to manage versions.
          </p>
        ) : (
          <>
            {/* List */}
            <div className="space-y-2">
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No versions yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {versions.map(v => (
                    <button
                      key={v.id}
                      onClick={() => onSelectVersion(v.id)}
                      className={[
                        "rounded-md border px-3 py-2 text-left text-sm hover:bg-muted transition",
                        selectedVersionId === v.id ? "border-primary" : "",
                      ].join(" ")}
                    >
                      <div className="font-medium">{v.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {v.s3Path ? v.s3Path : "S3 path will be set on upload"}
                      </div>
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
              <div className="text-sm font-medium">Create version</div>

              <div className="space-y-1">
                <Label>Version name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="v1.0.0" />
              </div>

              {err && <p className="text-sm text-destructive">{err}</p>}
              <Button onClick={createVersion} disabled={busy}>
                {busy ? "Creating..." : "Create"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
