"use client";

import { Loader2 } from "lucide-react";

type Props = {
    title?: string;
    description?: string;
    fullScreen?: boolean;
};

export function LoadingScreen({
    title = "Loading",
    description = "Please wait...",
    fullScreen = true,
}: Props) {
    const wrapperClass = fullScreen
        ? "min-h-screen w-full flex items-center justify-center px-4"
        : "w-full flex items-center justify-center px-4 py-10";

    return (
        <div className={wrapperClass}>
            <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <div className="space-y-1">
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    );
}