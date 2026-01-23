"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ProjectSelect } from "./project-select"
import { EnvironmentSelect } from "./env-select"
import { FileDropzone } from "./file-dropzone"

export function UploadForm() {
  const [project, setProject] = useState<string | null>(null)
  const [environment, setEnvironment] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [successUrl, setSuccessUrl] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessUrl(null)

    if (!project || !environment || !file) {
      setError("All fields are required")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("project", project)
    formData.append("environment", environment)

    try {
      setIsUploading(true)

      const res = await fetch("http://localhost:4000/api/builds/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Upload failed")
      }

      const data = await res.json()
      setSuccessUrl(data.publicUrl)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl rounded-lg border p-10">
      <h2 className="text-2xl font-semibold text-center mb-8">
        Upload Build
      </h2>

      <form
        onSubmit={onSubmit}
        className="flex flex-col items-center gap-6"
      >
        <ProjectSelect value={project} onChange={setProject} />
        <EnvironmentSelect
          value={environment}
          onChange={setEnvironment}
        />
        <FileDropzone file={file} onChange={setFile} />

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {successUrl && (
          <p className="text-sm text-green-600">
            ✅ Upload successful:{" "}
            <a
              href={successUrl}
              target="_blank"
              className="underline"
            >
              {successUrl}
            </a>
          </p>
        )}

        <Button
          type="submit"
          disabled={isUploading || !project || !environment || !file}
        >
          {isUploading ? "Uploading..." : "Upload Build"}
        </Button>
      </form>
    </section>
  )
}
