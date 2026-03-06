"use client";

import { AssignedBuild } from "../../../types";
import { useEffect, useState } from "react";
import { apiFetch } from "@/components/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/useAuth";

export default function ViewerHome() {
  const [builds, setBuilds] = useState<AssignedBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { me } = useAuth();
  useEffect(() => {
    loadBuilds();
  }, []);

  async function loadBuilds() {
    try {
      setLoading(true);
      const data = await apiFetch<AssignedBuild[]>("/api/viewer/builds", {
        method: "GET",
      });

      if (!Array.isArray(data)) {
        throw new Error("Invalid response");
      }

      setBuilds(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e?.message ?? "Failed to load builds");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(url: string, id: number) {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Loading builds...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">My Assigned Builds</h1>
        <p className="text-sm text-muted-foreground">
          Hi <b>{me?.name}</b>, You can access only the builds assigned to you.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {builds.length === 0 && (
        <p className="text-sm text-muted-foreground">No builds assigned yet.</p>
      )}

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ">
        {builds.map((b) => {
          const project = b.version.environment.project.name;
          const projectSlug = b.version.environment.project.slug;
          const env = b.version.environment.name;
          const envSlug = b.version.environment.slug;
          const version = b.version.name;

          const publicUrl = `/public/${projectSlug}/${envSlug}/${version}`;

          return (
            <Card
              key={b.id}
              className="flex flex-col justify-between hover:shadow-lg transition"
            >
              <CardHeader className="space-y-2">
                <CardTitle className="text-base font-sans font-normal">{project}</CardTitle>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary" className="font-sans font-normal">{env}</Badge>
                  <Badge variant="outline" className="font-sans font-normal">{version}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full"
                    onClick={() => {
                      let API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
                      if (typeof window !== "undefined" && window.origin.includes("themosaiccompany")) {
                        API_BASE = "https://preview-api.themosaiccompany.com:444";
                      }
                      const backendUrl = `${API_BASE}${publicUrl}`;
                      window.open(backendUrl, "_blank");
                    }}
                  >
                    Open Build
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const backendUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${publicUrl}`;
                      copyToClipboard(backendUrl, b.id);
                    }}
                  >
                    {copiedId === b.id ? "Copied!" : "Copy URL"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
