"use client";

import * as React from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expand, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export function FullscreenImageDialog({
    title,
    imageUrl,
}: {
    title: string;
    imageUrl: string;
}) {
    const [zoom, setZoom] = React.useState(1);
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });
    const [dragging, setDragging] = React.useState(false);

    const dragStartRef = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

    function resetView() {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    }

    function zoomBy(delta: number) {
        setZoom((z) => clamp(Number((z + delta).toFixed(2)), 1, 4));
        // when going back to 1, reset pan to avoid weirdness
        setTimeout(() => {
            setZoom((z) => {
                if (z <= 1) {
                    setOffset({ x: 0, y: 0 });
                    return 1;
                }
                return z;
            });
        }, 0);
    }

    return (
        <Dialog
            onOpenChange={(open) => {
                if (!open) resetView();
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Fullscreen">
                    <Expand className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Fullscreen preview</DialogDescription>
                </DialogHeader>

                {/* Controls */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="icon" onClick={() => zoomBy(-0.25)} disabled={zoom <= 1}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={() => zoomBy(0.25)} disabled={zoom >= 4}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={resetView} disabled={zoom === 1 && offset.x === 0 && offset.y === 0}>
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Zoom: <span className="font-medium text-foreground">{Math.round(zoom * 100)}%</span>
                        {zoom > 1 ? <span className="ml-2">Drag to pan • Wheel to zoom</span> : null}
                    </div>
                </div>

                {/* Viewer */}
                <div
                    className="relative h-[70vh] w-full overflow-hidden rounded-md border bg-muted select-none"
                    onWheel={(e) => {
                        e.preventDefault();
                        const delta = e.deltaY > 0 ? -0.15 : 0.15; // natural-ish
                        setZoom((z) => clamp(Number((z + delta).toFixed(2)), 1, 4));
                    }}
                    onMouseDown={(e) => {
                        if (zoom <= 1) return;
                        setDragging(true);
                        dragStartRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
                    }}
                    onMouseMove={(e) => {
                        if (!dragging || !dragStartRef.current) return;
                        const dx = e.clientX - dragStartRef.current.x;
                        const dy = e.clientY - dragStartRef.current.y;
                        setOffset({ x: dragStartRef.current.ox + dx, y: dragStartRef.current.oy + dy });
                    }}
                    onMouseUp={() => {
                        setDragging(false);
                        dragStartRef.current = null;
                    }}
                    onMouseLeave={() => {
                        setDragging(false);
                        dragStartRef.current = null;
                    }}
                    style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
                >
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                            transformOrigin: "center",
                            transition: dragging ? "none" : "transform 120ms ease",
                        }}
                    >
                        <Image src={imageUrl} alt={title} width={1400} height={900} className="h-auto w-auto max-h-[70vh] max-w-full object-contain" unoptimized />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}