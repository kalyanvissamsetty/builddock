"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProjectSelect } from "../../upload/project-select";
import { EnvironmentSelect } from "../../upload/env-select";
import { FileDropzone } from "../../upload/file-dropzone";

import { apiFetch } from "../../lib/api";
import { VersionSelect } from "../../upload/version-select";
import { UploadSuccess } from "../../upload/dialog/UploadSuccess";
import { Project, Environment, Version, UploadBuildResponse } from "@/types";
import { Textarea } from "@/components/ui/textarea";

export function UploadBuild() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [releaseNotes, setReleaseNotes] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isOpenSuccessDialog, setSuccessDialog] = useState<boolean>(false);
  const [isBuildActivated, setBuildActivated] = useState<boolean>(false);

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
    setReleaseNotes("");
    setFile(null);
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
    refreshEnvironemts(selectedProjectId).catch(console.error);
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedEnvId == null || selectedProjectId == null) return;

    setVersions([]);
    setSelectedVersionId(null);

    refreshVersions(selectedProjectId, selectedEnvId).catch(console.error);
  }, [selectedEnvId, selectedProjectId]);
  async function activateVersion() {
    await apiFetch<void>(`/versions/${selectedVersionId}/activate`, {
      method: "POST",
    });

    return true;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedEnvId || !selectedProjectId || !selectedVersionId || !file || !releaseNotes) {
      setError("All fields are required");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", selectedProjectId.toString());
    formData.append("environmentId", selectedEnvId.toString());
    formData.append("versionId", selectedVersionId.toString());
    formData.append("releaseNotes", releaseNotes);
    try {
      setIsUploading(true);

      const data = await apiFetch<UploadBuildResponse>("/api/builds/upload", {
        method: "POST",
        body: formData,
      });

      setReleaseNotes("");
      setSuccessDialog(true);
      setBuildActivated(data.isThisVersionDefault);
      //resetForm();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }
  useEffect(() => {
    if (!isOpenSuccessDialog) {
      resetForm();
    }
  }, [isOpenSuccessDialog]);
  return (
    <section className="mx-auto w-full max-w-4xl rounded-lg border p-10">
      <h2 className="text-2xl font-semibold text-center mb-8">Upload Build</h2>
      <UploadSuccess
        isOpenSuccessDialog={isOpenSuccessDialog}
        setSuccessDialog={setSuccessDialog}
        showActivateButton={!isBuildActivated}
        activateVersion={activateVersion}
      />
      <form onSubmit={onSubmit} className="flex flex-col items-center gap-6">
        <ProjectSelect
          value={
            selectedProjectId != null ? String(selectedProjectId) : undefined
          }
          onChange={(id) => {
            setSelectedProjectId(id);
          }}
          projects={projects}
          refreshProjects={refreshProjects}
          showAddProject={false}
        />
        <EnvironmentSelect
          value={selectedEnvId != null ? String(selectedEnvId) : undefined}
          onChange={(id) => {
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
          showAddVersion={true}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}

        
        <Textarea
          value={releaseNotes}
          onChange={(e) => setReleaseNotes(e.target.value)}
          placeholder="Release notes for this upload..."
          className="min-h-[120px] max-w-[400px]"
        />
        <FileDropzone file={file} onChange={setFile} />
        <div className="flex flex-row gap-12">
          <Button
            type="submit"
            disabled={
              isUploading ||
              !selectedProjectId ||
              !selectedEnvId ||
              !selectedVersionId ||
              !file ||
              !releaseNotes
            }
          >
            {isUploading ? "Uploading..." : "Upload Build"}
          </Button>
          <Button type="button" variant="outline" onClick={resetForm}>
            Reset
          </Button>
        </div>
      </form>
    </section>
  );
}
