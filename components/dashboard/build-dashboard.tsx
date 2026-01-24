"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import ProjectPanel from "./project-panel";
import EnvironmentPanel from "./environment-panel";
import VersionPanel from "./version-panel";
import { UploadForm } from "@/components/upload/upload-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Project = { id: number; name: string; slug: string; createdAt: string };
export type Environment = { id: number; name: string; slug: string; projectId: number; createdAt: string };
export type Version = { id: number; name: string; environmentId: number; s3Path: string; isActive: boolean; createdAt: string };

export default function BuildDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const selectedEnv = useMemo(
    () => envs.find(e => e.id === selectedEnvId) ?? null,
    [envs, selectedEnvId]
  );

  const selectedVersion = useMemo(
    () => versions.find(v => v.id === selectedVersionId) ?? null,
    [versions, selectedVersionId]
  );

  async function refreshProjects(selectId?: number) {
    const data = await apiFetch<Project[]>("/projects");
    setProjects(data);
    if (selectId) setSelectedProjectId(selectId);
  }

  async function refreshEnvs(projectId: number, selectId?: number) {
    const data = await apiFetch<Environment[]>(`/projects/${projectId}/environments`);
    setEnvs(data);
    if (selectId) setSelectedEnvId(selectId);
  }

  async function refreshVersions(projectId: number, envId: number, selectId?: number) {
    const data = await apiFetch<Version[]>(`/projects/${projectId}/environments/${envId}/versions`);
    setVersions(data);
    if (selectId) setSelectedVersionId(selectId);
  }

  // Initial load
  useEffect(() => {
    refreshProjects().catch(console.error);
  }, []);

  // When project changes → load envs, clear lower selections
  useEffect(() => {
    setEnvs([]);
    setVersions([]);
    setSelectedEnvId(null);
    setSelectedVersionId(null);

    if (!selectedProjectId) return;
    refreshEnvs(selectedProjectId).catch(console.error);
  }, [selectedProjectId]);

  // When env changes → load versions, clear version selection
  useEffect(() => {
    setVersions([]);
    setSelectedVersionId(null);

    if (!selectedProjectId || !selectedEnvId) return;
    refreshVersions(selectedProjectId, selectedEnvId).catch(console.error);
  }, [selectedEnvId, selectedProjectId]);

  return (
    <div className="space-y-6">
      {/* Row 1: 3 cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ProjectPanel
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onCreated={async (newProjectId: number | undefined) => {
            await refreshProjects(newProjectId);
          }}
        />

        <EnvironmentPanel
          project={selectedProject}
          environments={envs}
          selectedEnvId={selectedEnvId}
          onSelectEnv={setSelectedEnvId}
          onCreated={async (newEnvId: number | undefined) => {
            if (!selectedProjectId) return;
            await refreshEnvs(selectedProjectId, newEnvId);
          }}
        />

        <VersionPanel
          project={selectedProject}
          environment={selectedEnv}
          versions={versions}
          selectedVersionId={selectedVersionId}
          onSelectVersion={setSelectedVersionId}
          onCreated={async (newVersionId: number | undefined) => {
            if (!selectedProjectId || !selectedEnvId) return;
            await refreshVersions(selectedProjectId, selectedEnvId, newVersionId);
          }}
        />
      </div>

      {/* Row 2: Upload */}
      <Card className="border">
        <CardHeader>
          <CardTitle>Upload build</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadForm
            selectedProject={selectedProject}
            selectedEnvironment={selectedEnv}
            selectedVersion={selectedVersion}
          />
        </CardContent>
      </Card>
    </div>
  );
}
