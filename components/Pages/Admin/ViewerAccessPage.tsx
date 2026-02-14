"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ViewerSelect } from "../../Helpers/ViewerSelect";
import { ProjectSelect } from "@/components/upload/project-select";
import { EnvironmentSelect } from "@/components/upload/env-select";
import { VersionSelect } from "@/components/upload/version-select";
import { AssignedBuildsList } from "../../Helpers/AssignedBuildsList";
import { apiFetch } from "@/components/lib/api";
import { Environment, Project, Version } from "@/types";
export type AssignedBuild = {
  id: number;
  userId: number;
  versionId: number;
  createdAt: string;
  version: {
    id: number;
    name: string;
    environment: {
      id: number;
      name: string;
      project: {
        id: number;
        name: string;
      };
    };
  };
};
export function ViewerAccessPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(
    null,
  );
  const [viewerId, setViewerId] = useState<number | null>(null);

  const [assigned, setAssigned] = useState<AssignedBuild[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function loadAssigned(currentViewerId: number) {
    try {
      setError(null);
      const data = await apiFetch<AssignedBuild[]>(
        `/api/admin/viewer-access/${currentViewerId}`,
        { method: "GET" },
      );

      if (!Array.isArray(data)) {
        throw new Error("Invalid response from server");
      }

      setAssigned(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setAssigned([]);
      setError(e?.message ?? "Failed to load assigned builds");
    }
  }
  useEffect(() => {
    if (!viewerId) {
      setAssigned([]);
      return;
    }

    loadAssigned(viewerId);
  }, [viewerId]);
  async function refreshProjects(id?: number) {
    const projects = await apiFetch<Project[]>("/projects");
    setProjects(projects);
    if (id) setSelectedProjectId(id);
  }

  async function refreshEnvironemts(projectId?: number, envId?: number) {
    const envs = await apiFetch<Environment[]>(
      `/projects/${projectId}/environments`,
    );
    setEnvs(envs);
    if (envId) setSelectedEnvId(envId);
  }
  function resetForm() {
    setSelectedProjectId(null);
    setSelectedEnvId(null);
    setSelectedVersionId(null);

    setEnvs([]);
    setVersions([]);

    setError(null);
  }
  async function refreshVersions(
    projectId?: number,
    envId?: number,
    versionId?: number,
  ) {
    const versions = await apiFetch<Version[]>(
      `/projects/${projectId}/environments/${envId}/versions`,
    );
    setVersions(versions);

    if (versionId) setSelectedVersionId(versionId);
  }

  useEffect(() => {
    refreshProjects().catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    setEnvs([]);
    setVersions([]);
    setSelectedEnvId(null);
    setSelectedVersionId(null);
    console.log("Refresed envs: " + selectedProjectId);
    refreshEnvironemts(selectedProjectId).catch(console.error);
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedEnvId == null || selectedProjectId == null) return;

    setVersions([]);
    setSelectedVersionId(null);
    console.log("Version effect " + selectedProjectId + " " + selectedEnvId);
    refreshVersions(selectedProjectId, selectedEnvId).catch(console.error);
  }, [selectedEnvId, selectedProjectId]);
  async function assign() {
    if (!viewerId || !selectedVersionId) return;

    setLoading(true);
    console.log(viewerId + " " + selectedVersionId);
    await apiFetch("/api/admin/viewer-access", {
      method: "POST",
      body: JSON.stringify({ userId: viewerId, versionId: selectedVersionId }),
    });
    loadAssigned(viewerId);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Assign Build Access</h1>
        <p className="text-sm text-muted-foreground">
          Control which builds a viewer can access
        </p>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Card: Assignment */}
        <div className="rounded-lg border bg-card p-6 space-y-6">
          <h2 className="text-lg font-medium">Assignment</h2>

          <div className="space-y-4">
            <ViewerSelect value={viewerId} onChange={setViewerId} />

            <ProjectSelect
              value={selectedProjectId ? String(selectedProjectId) : undefined}
              onChange={setSelectedProjectId}
              projects={projects}
              refreshProjects={refreshProjects}
              showAddProject={false}
            />

            <EnvironmentSelect
              projectId={selectedProjectId ?? undefined}
              value={selectedEnvId ? String(selectedEnvId) : undefined}
              onChange={setSelectedEnvId}
              envs={envs}
              refreshEnvironemts={refreshEnvironemts}
              showAddEnvironment={false}
            />

            <VersionSelect
              projectId={selectedProjectId ?? undefined}
              envId={selectedEnvId ?? undefined}
              value={selectedVersionId ? String(selectedVersionId) : undefined}
              onChange={setSelectedVersionId}
              versions={versions}
              refreshVersions={refreshVersions}
              showAddVersion={false}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={assign}
            disabled={!viewerId || !selectedVersionId || loading}
            className="w-full"
          >
            {loading ? "Assigning..." : "Assign Access"}
          </Button>
        </div>

        {/* Right Card: Assigned Builds */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          {!viewerId && (
            <p className="text-sm text-muted-foreground">
              Select a viewer to see assigned builds
            </p>
          )}

          {viewerId && (
            <AssignedBuildsList
              viewerId={viewerId}
              builds={assigned}
              onChange={() => loadAssigned(viewerId)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
