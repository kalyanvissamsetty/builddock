"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProjectSelect } from "../../upload/project-select";
import { EnvironmentSelect } from "../../upload/env-select";
import { FileDropzone } from "../../upload/file-dropzone";
import { apiFetch } from "../../lib/api";
import { VersionSelect } from "../../upload/version-select";
import { UploadSuccess } from "../../upload/dialog/UploadSuccess";
import { Project, Environment, Version, UploadBuildResponse } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { UploadProgressPanel, UploadSseEvent } from "./UploadProgressPanel";


export function UploadBuild() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [releaseNotes, setReleaseNotes] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isOpenSuccessDialog, setSuccessDialog] = useState<boolean>(false);
  const [isBuildActivated, setBuildActivated] = useState<boolean>(false);
  const [hasUploadFailed, setHasUploadFailed] = useState(false);
  const [progressEvent, setProgressEvent] = useState<UploadSseEvent | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

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

  function cleanupSse() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }

  function resetForm() {
    cleanupSse();
    setSelectedProjectId(null);
    setSelectedEnvId(null);
    setHasUploadFailed(false);
    setSelectedVersionId(null);
    setEnvs([]);
    setVersions([]);
    setReleaseNotes("");
    setFile(null);
    setError(null);
    setProgressEvent(null);
    setIsUploading(false);
  }

  useEffect(() => {
    refreshProjects().catch(console.error);
    return () => cleanupSse();
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

  useEffect(() => {
    if (!isOpenSuccessDialog) {
      resetForm();
    }
  }, [isOpenSuccessDialog]);

  async function activateVersion() {
    await apiFetch<void>(`/versions/${selectedVersionId}/activate`, {
      method: "POST",
    });

    return true;
  }

  function createUploadId() {
    return crypto.randomUUID();
  }

  function connectToProgress(uploadId: string) {
    cleanupSse();

    const es = new EventSource(
      `/api/builds/upload/progress/${uploadId}`,
      { withCredentials: true },
    );

    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as UploadSseEvent;
        setProgressEvent(data);

        if (data.type === "completed" || data.type === "error") {
          cleanupSse();
        }
      } catch (err) {
        console.error("Failed to parse SSE event", err);
      }
    };

    es.onerror = () => {
      console.error("SSE connection error");
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setHasUploadFailed(false);

    if (
      !selectedEnvId ||
      !selectedProjectId ||
      !selectedVersionId ||
      !file ||
      !releaseNotes
    ) {
      setError("All fields are required");
      return;
    }

    const uploadId = createUploadId();
    connectToProgress(uploadId);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", selectedProjectId.toString());
    formData.append("environmentId", selectedEnvId.toString());
    formData.append("versionId", selectedVersionId.toString());
    formData.append("releaseNotes", releaseNotes);
    formData.append("uploadId", uploadId);

    try {
      setIsUploading(true);
      setProgressEvent({
        type: "status",
        message: "Connecting to upload stream...",
        overallPercent: 0,
        currentFilePercent: 0,
      });

      const data = await apiFetch<UploadBuildResponse>("/api/builds/upload", {
        method: "POST",
        body: formData,
      });

      setReleaseNotes("");
      setBuildActivated(data.isThisVersionDefault);
      setSuccessDialog(true);
      setProgressEvent({
        type: "completed",
        message: "Build uploaded successfully",
        overallPercent: 100,
        currentFilePercent: 100,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Upload failed";

      setError(message);
      setHasUploadFailed(true);
      setProgressEvent({
        type: "error",
        message,
      });
      cleanupSse();
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl rounded-2xl border bg-background p-8 shadow-sm">
      <h2 className="mb-8 text-center text-2xl font-semibold">Upload Build</h2>

      <UploadSuccess
        isOpenSuccessDialog={isOpenSuccessDialog}
        setSuccessDialog={setSuccessDialog}
        showActivateButton={!isBuildActivated}
        activateVersion={activateVersion}
      />

      <form onSubmit={onSubmit} className="flex flex-col items-center gap-6">
        <ProjectSelect
          value={selectedProjectId != null ? String(selectedProjectId) : undefined}
          onChange={(id) => setSelectedProjectId(id)}
          projects={projects}
          refreshProjects={refreshProjects}
          showAddProject={false}
        />

        <EnvironmentSelect
          value={selectedEnvId != null ? String(selectedEnvId) : undefined}
          onChange={(id) => setSelectedEnvId(id)}
          envs={envs}
          refreshEnvironemts={refreshEnvironemts}
          projectId={selectedProjectId ?? undefined}
          showAddEnvironment={false}
        />

        <VersionSelect
          value={selectedVersionId != null ? String(selectedVersionId) : undefined}
          onChange={(id) => setSelectedVersionId(id)}
          versions={versions}
          projectId={selectedProjectId ?? undefined}
          envId={selectedEnvId ?? undefined}
          refreshVersions={refreshVersions}
          showAddVersion={true}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Textarea
          value={releaseNotes}
          onChange={(e) => setReleaseNotes(e.target.value)}
          placeholder="Release notes for this upload..."
          className="min-h-[120px] max-w-[500px]"
        />

        <FileDropzone
          file={file}
          onChange={(newFile) => {
            setFile(newFile);
            setHasUploadFailed(false);
            setError(null);
          }}
        />

        <UploadProgressPanel
          isUploading={isUploading}
          progress={progressEvent}
        />

        <div className="flex flex-row gap-4">
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
            {isUploading ? "Uploading..." : hasUploadFailed ? "Retry Upload" : "Upload Build"}
          </Button>

          <Button type="button" variant="outline" onClick={resetForm}>
            Reset
          </Button>
        </div>
      </form>
    </section>
  );
}