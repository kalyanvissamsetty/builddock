"use client";

import { memo } from "react";

export type UploadSseEvent = {
    type: "status" | "progress" | "completed" | "error";
    step?: "extracting" | "validating" | "uploading" | "finalizing";
    message?: string;
    currentFile?: string;
    currentFilePercent?: number;
    overallPercent?: number;
};

type UploadProgressPanelProps = {
    isUploading: boolean;
    progress: UploadSseEvent | null;
};

function UploadProgressPanelComponent({
    isUploading,
    progress,
}: UploadProgressPanelProps) {
    if (!isUploading && !progress) return null;

    const overallPercent = progress?.overallPercent ?? 0;
    const currentFilePercent = progress?.currentFilePercent ?? 0;
    const message = progress?.message ?? (isUploading ? "Starting upload..." : "");
    const currentFile = progress?.currentFile ?? "";

    return (
        <div className="w-full max-w-[500px] rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Upload Progress</h3>
                <span className="text-xs text-muted-foreground">
                    {progress?.type === "completed"
                        ? "Completed"
                        : progress?.type === "error"
                            ? "Failed"
                            : isUploading
                                ? "In Progress"
                                : "Idle"}
                </span>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span>Overall</span>
                    <span>{overallPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                    <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${overallPercent}%` }}
                    />
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="truncate pr-3">
                        {currentFile || "Waiting for file progress..."}
                    </span>
                    <span>{currentFilePercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                    <div
                        className="h-full rounded-full bg-primary/70 transition-all duration-300"
                        style={{ width: `${currentFilePercent}%` }}
                    />
                </div>
            </div>

            <p className="text-sm text-muted-foreground break-words">{message}</p>
        </div>
    );
}

export const UploadProgressPanel = memo(UploadProgressPanelComponent);