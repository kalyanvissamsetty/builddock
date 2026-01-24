// components/upload/upload-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "./file-dropzone";
import type { Project, Environment, Version } from "@/components/dashboard/build-dashboard";

type Props = {
  selectedProject: Project | null;
  selectedEnvironment: Environment | null;
  selectedVersion: Version | null;
};

export function UploadForm({ selectedProject, selectedEnvironment, selectedVersion }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessUrl(null);

    if (!selectedProject || !selectedEnvironment || !selectedVersion || !file) {
      setError("Select project, environment, version, and choose a ZIP file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // for now: keep your backend expectation (strings)
    // later: we will switch this to versionId and let backend compute s3Path
    formData.append("project", selectedProject.slug);
    formData.append("environment", selectedEnvironment.slug);
    formData.append("version", selectedVersion.name);

    try {
      setIsUploading(true);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/builds/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
      }

      const data = await res.json();
      setSuccessUrl(data.publicUrl);
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  const disabled = !selectedProject || !selectedEnvironment || !selectedVersion;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Selected:
        {" "}
        <span className="font-medium">
          {selectedProject?.slug ?? "—"}/{selectedEnvironment?.slug ?? "—"}/{selectedVersion?.name ?? "—"}
        </span>
      </div>

      <FileDropzone file={file} onChange={setFile} />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {successUrl && (
        <p className="text-sm text-green-600">
          ✅ Upload successful:{" "}
          <a href={successUrl} target="_blank" className="underline">
            {successUrl}
          </a>
        </p>
      )}

      <Button type="submit" disabled={isUploading || disabled || !file}>
        {isUploading ? "Uploading..." : "Upload Build"}
      </Button>

      {disabled && (
        <p className="text-xs text-muted-foreground">
          Create/select a project, environment, and version above to enable uploads.
        </p>
      )}
    </form>
  );
}
