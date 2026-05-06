"use client";

import * as React from "react";
import Image from "next/image";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expand, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function roundZoom(n: number) {
    return Number(n.toFixed(2));
}

export function FullscreenImageDialog({
    title,
    imageUrl,
}: {
    title: string;
    imageUrl: string;
}) {
    const [open, setOpen] = React.useState(false);
    const [zoom, setZoom] = React.useState(MIN_ZOOM);
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });
    const [dragging, setDragging] = React.useState(false);

    const viewerRef = React.useRef<HTMLDivElement | null>(null);
    const dragStartRef = React.useRef<{
        pointerId: number;
        x: number;
        y: number;
        ox: number;
        oy: number;
    } | null>(null);

    const clampOffset = React.useCallback((nextOffset: { x: number; y: number }, nextZoom = zoom) => {
        if (nextZoom <= MIN_ZOOM) return { x: 0, y: 0 };

        const viewer = viewerRef.current;
        if (!viewer) return nextOffset;

        const maxX = (viewer.clientWidth * (nextZoom - 1)) / 2;
        const maxY = (viewer.clientHeight * (nextZoom - 1)) / 2;

        return {
            x: clamp(nextOffset.x, -maxX, maxX),
            y: clamp(nextOffset.y, -maxY, maxY),
        };
    }, [zoom]);

    function resetView() {
        setZoom(MIN_ZOOM);
        setOffset({ x: 0, y: 0 });
        setDragging(false);
        dragStartRef.current = null;
    }

    function setZoomLevel(next: number) {
        const nextZoom = clamp(roundZoom(next), MIN_ZOOM, MAX_ZOOM);
        setZoom(nextZoom);
        setOffset((current) => clampOffset(current, nextZoom));
    }

    function zoomBy(delta: number) {
        setZoom((current) => {
            const nextZoom = clamp(roundZoom(current + delta), MIN_ZOOM, MAX_ZOOM);
            setOffset((currentOffset) => clampOffset(currentOffset, nextZoom));
            return nextZoom;
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                setOpen(open);
                if (!open) resetView();
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Fullscreen">
                    <Expand className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent
                className="gap-3 overflow-hidden p-4 sm:max-w-6xl sm:p-5"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "calc(100dvh - 2rem)",
                    maxHeight: "calc(100dvh - 2rem)",
                }}
            >
                <DialogHeader className="shrink-0 pr-8">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Zoom in, drag to pan, or use the mouse wheel.</DialogDescription>
                </DialogHeader>

                <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => zoomBy(-ZOOM_STEP)}
                            disabled={zoom <= MIN_ZOOM}
                            title="Zoom out"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <div className="min-w-14 text-center text-sm font-medium tabular-nums">
                            {Math.round(zoom * 100)}%
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => zoomBy(ZOOM_STEP)}
                            disabled={zoom >= MAX_ZOOM}
                            title="Zoom in"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={resetView}
                            disabled={zoom === MIN_ZOOM && offset.x === 0 && offset.y === 0}
                            title="Reset preview"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Wheel to zoom. Drag to pan when zoomed.
                    </p>
                </div>

                <div
                    ref={viewerRef}
                    tabIndex={0}
                    className="relative min-h-[260px] flex-1 touch-none select-none overflow-hidden rounded-md border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onWheel={(e) => {
                        e.preventDefault();
                        zoomBy(e.deltaY > 0 ? -0.15 : 0.15);
                    }}
                    onDoubleClick={() => {
                        if (zoom === MIN_ZOOM) setZoomLevel(2);
                        else resetView();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "+" || e.key === "=") {
                            e.preventDefault();
                            zoomBy(ZOOM_STEP);
                            return;
                        }
                        if (e.key === "-" || e.key === "_") {
                            e.preventDefault();
                            zoomBy(-ZOOM_STEP);
                            return;
                        }
                        if (e.key === "0") {
                            e.preventDefault();
                            resetView();
                            return;
                        }

                        if (zoom <= MIN_ZOOM) return;

                        const panStep = e.shiftKey ? 60 : 24;
                        if (e.key === "ArrowLeft") {
                            e.preventDefault();
                            setOffset((current) => clampOffset({ ...current, x: current.x + panStep }));
                        } else if (e.key === "ArrowRight") {
                            e.preventDefault();
                            setOffset((current) => clampOffset({ ...current, x: current.x - panStep }));
                        } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setOffset((current) => clampOffset({ ...current, y: current.y + panStep }));
                        } else if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setOffset((current) => clampOffset({ ...current, y: current.y - panStep }));
                        }
                    }}
                    onPointerDown={(e) => {
                        if (zoom <= MIN_ZOOM) return;
                        e.currentTarget.setPointerCapture(e.pointerId);
                        setDragging(true);
                        dragStartRef.current = {
                            pointerId: e.pointerId,
                            x: e.clientX,
                            y: e.clientY,
                            ox: offset.x,
                            oy: offset.y,
                        };
                    }}
                    onPointerMove={(e) => {
                        if (!dragging || !dragStartRef.current) return;
                        const dx = e.clientX - dragStartRef.current.x;
                        const dy = e.clientY - dragStartRef.current.y;
                        setOffset(clampOffset({
                            x: dragStartRef.current.ox + dx,
                            y: dragStartRef.current.oy + dy,
                        }));
                    }}
                    onPointerUp={(e) => {
                        if (dragStartRef.current?.pointerId === e.pointerId) {
                            e.currentTarget.releasePointerCapture(e.pointerId);
                        }
                        setDragging(false);
                        dragStartRef.current = null;
                    }}
                    onPointerCancel={() => {
                        setDragging(false);
                        dragStartRef.current = null;
                    }}
                    style={{ cursor: zoom > MIN_ZOOM ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
                >
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                            transformOrigin: "center",
                            transition: dragging ? "none" : "transform 120ms ease",
                        }}
                    >
                        <Image
                            src={imageUrl}
                            alt={title}
                            width={1400}
                            height={900}
                            className="pointer-events-none h-auto w-auto max-h-full max-w-full object-contain"
                            draggable={false}
                            unoptimized
                        />
                    </div>
                </div>

                <DialogFooter className="shrink-0">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
