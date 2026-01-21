"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileArchive, Upload, X } from "lucide-react";

export default function FileUpload() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(selectedFile: File) {
    if (!selectedFile.name.endsWith(".zip")) {
      setError("Only ZIP files are allowed");
      return;
    }

    setError(null);
    setFile(selectedFile);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function removeFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="sm:mx-auto sm:max-w-lg flex items-center justify-center p-10 w-full max-w-lg">
      <form className="w-full">
        <h3 className="text-lg font-semibold text-foreground">
          Build Upload
        </h3>

        {/* Drop Zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="mt-4 flex justify-center rounded-md border border-dashed border-input px-6 py-10 hover:border-primary transition"
        >
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />

            <div className="mt-4 flex justify-center text-sm leading-6 text-foreground">
              <p>Drag and drop or</p>
              <Label
                htmlFor="file-upload"
                className="relative cursor-pointer pl-1 font-medium text-primary hover:underline"
              >
                <span>choose file</span>
                <input
                  ref={inputRef}
                  id="file-upload"
                  type="file"
                  accept=".zip"
                  className="sr-only"
                  onChange={onInputChange}
                />
              </Label>
              <p className="pl-1">to upload</p>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              ZIP files only (Unity WebGL build)
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}

        {/* Selected File Preview */}
        {file && (
          <div className="relative mt-6 rounded-lg bg-muted p-3">
            <div className="absolute right-1 top-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-background shadow-sm ring-1 ring-input">
                <FileArchive className="size-5" />
              </span>
              <div className="w-full">
                <p className="text-xs font-medium text-foreground">
                  {file.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Button type="submit" disabled={!file}>
            Upload
          </Button>
        </div>
      </form>
    </div>
  );
}
