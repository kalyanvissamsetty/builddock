"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProjectSelect } from "../../upload/project-select";
import { EnvironmentSelect } from "../../upload/env-select";

import { VersionSelect } from "../../upload/version-select";
import { Project, Environment, Version } from "@/types";

import {
  fetchProjects,
  fetchEnvironments,
  fetchVersions,
} from "@/components/lib/build-api";

export default function UpdateVersion() {
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

  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdateSuccess, setUpdateSuccess] = useState(false);
  async function refreshProjects(id?: number) {
    const projects = await fetchProjects();
    setProjects(projects);
    if (id) setSelectedProjectId(id);
  }

  async function refreshEnvironemts(projectId?: number, envId?: number) {
    if (projectId === undefined || projectId === null) {
      setEnvs([]);
      return;
    }
    const envs = await fetchEnvironments(projectId);
    setEnvs(envs);
    if (envId !== undefined && envId !== null) setSelectedEnvId(envId);
  }
  async function refreshVersions(
    projectId?: number,
    envId?: number,
    versionId?: number,
  ) {
    if (
      projectId === undefined ||
      projectId === null ||
      envId === undefined ||
      envId === null
    ) {
      setVersions([]);
      return;
    }
    const versions = await fetchVersions(projectId, envId);
    setVersions(versions);

    if (versionId !== undefined && versionId !== null)
      setSelectedVersionId(versionId);
  }
  function resetForm() {
    setSelectedProjectId(null);
    setSelectedEnvId(null);
    setSelectedVersionId(null);

    setEnvs([]);
    setVersions([]);
    setUpdateSuccess(false);
    setError(null);
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedEnvId || !selectedProjectId || !selectedVersionId) {
      setError("All fields are required");
      return;
    }

    try {
      setIsUpdating(true);
      const res = await fetch(
        `http://localhost:4000/versions/${selectedVersionId}/activate`,
        {
          method: "POST",
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Update failed");
      }

      resetForm();
      console.log("res status - " + res.status);
      if (res.status == 204) setUpdateSuccess(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl rounded-lg border p-10 bg-">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-semibold text-center mb-8">
          Update Default Build
        </h2>
        <p className="text-xs italic font-light text-gray-500 -m-4">
          Use this form to update default build to each environment
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col items-center gap-6 my-16"
      >
        <ProjectSelect
          value={
            selectedProjectId != null ? String(selectedProjectId) : undefined
          }
          onChange={(id) => {
            console.log("Project id changed - " + id);
            setSelectedProjectId(id);
          }}
          projects={projects}
          refreshProjects={refreshProjects}
          showAddProject={false}
        />
        <EnvironmentSelect
          value={selectedEnvId != null ? String(selectedEnvId) : undefined}
          onChange={(id) => {
            console.log("Env id changed - " + id);
            setSelectedEnvId(id);
          }}
          envs={envs}
          refreshEnvironemts={refreshEnvironemts}
          projectId={selectedProjectId ? selectedProjectId : undefined}
          showAddEnvironment={false}
        />

        <VersionSelect
          value={
            selectedVersionId != null ? String(selectedVersionId) : undefined
          }
          onChange={(id) => setSelectedVersionId(id)}
          versions={versions}
          projectId={selectedProjectId ? selectedProjectId : undefined}
          envId={selectedEnvId ? selectedEnvId : undefined}
          refreshVersions={refreshVersions}
          showAddVersion={false}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}

        {isUpdateSuccess && (
          <p className="text-sm text-green-600">Update Successful</p>
        )}
        <div className="flex flex-row gap-12">
          <Button
            type="submit"
            disabled={
              isUpdating ||
              !selectedProjectId ||
              !selectedEnvId ||
              !selectedVersionId
            }
          >
            {isUpdating ? "Saving..." : "Update"}
          </Button>
          <Button type="button" variant="outline" onClick={resetForm}>
            Reset
          </Button>
        </div>
      </form>
    </section>
  );
}
