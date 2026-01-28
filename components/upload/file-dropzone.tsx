"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FileArchive, Upload, X } from "lucide-react"

type Props = {
  file: File | null
  onChange: (file: File | null) => void
  error?: string | null
}

export function FileDropzone({ file, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  function resetInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }
  useEffect(()=>{
    if(file == null) resetInput()
  },[file])

  function selectFile(selected: File) {
    if (!selected.name.endsWith(".zip")) {
      onChange(null)
      resetInput()
      return
    }
    onChange(selected)
  }

  return (
    <div className="w-full max-w-sm">
      <div
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) selectFile(f);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-md border border-dashed px-6 py-10 text-center hover:border-primary transition"
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />

        <div className="mt-4 flex justify-center text-sm">
          <p>Drag and drop or</p>
          <Label
            htmlFor="file"
            className="cursor-pointer pl-1 text-primary hover:underline"
          >
            choose file
            <input
              ref={inputRef}
              id="file"
              type="file"
              accept=".zip"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) selectFile(f);
              }}
            />
          </Label>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          ZIP only (Unity WebGL)
        </p>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {file && (
        <div className="relative mt-4 rounded-md bg-muted p-3">
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1"
            onClick={() => {
              onChange(null);
              resetInput();
            }}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3">
            <FileArchive className="h-5 w-5" />
            <div>
              <p className="text-xs font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
