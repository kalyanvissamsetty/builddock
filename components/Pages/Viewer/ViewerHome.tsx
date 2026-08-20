"use client";

import { AssignedBuild } from "../../../types";
import { useEffect, useState } from "react";
import { apiFetch, getApiBase } from "@/components/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/useAuth";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

import { getGreetingName } from "../GraphicReviews/ProfileSelectionPage";
import React from "react";

type ExtendedAssignedBuild = AssignedBuild & {
  // optional fields from backend (safe if not present)
  version: AssignedBuild["version"] & {
    lastUploadedAt?: string | null;
    lastUploadedByUser?: { name?: string | null; email: string } | null;
  };
};

export default function ViewerHome() {
  const [builds, setBuilds] = useState<ExtendedAssignedBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { me } = useAuth();
  const greetingName = React.useMemo(() => getGreetingName(me?.name, me?.email), [me]);
  useEffect(() => {
    loadBuilds();
  }, []);

  async function loadBuilds() {
    try {
      setLoading(true);
      const data = await apiFetch<ExtendedAssignedBuild[]>("/api/viewer/builds", {
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

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <LoadingScreen title="Loading builds" description="Fetching your assigned builds..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">My Assigned Builds</h1>
        <p className="text-sm text-muted-foreground">
          Hi <b>{greetingName}</b>, you can access only the builds assigned to you.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {builds.length === 0 && (
        <p className="text-sm text-muted-foreground">No builds assigned yet.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {builds.map((b) => {
          const project = b.version.environment.project.name;
          const projectSlug = b.version.environment.project.slug;
          const env = b.version.environment.name;
          const envSlug = b.version.environment.slug;
          const version = b.version.name;

          const publicUrl = `/public/${projectSlug}/${envSlug}/${version}`;
          const backendUrl = `${getApiBase()}${publicUrl}`;

          return (
            <Card
              key={b.id}
              className="flex flex-col justify-between hover:shadow-lg transition"
            >
              <CardHeader className="space-y-2">
                <CardTitle className="text-base font-sans font-normal">
                  {project}
                </CardTitle>

                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary" className="font-sans font-normal">
                    {env}
                  </Badge>
                  <Badge variant="outline" className="font-sans font-normal">
                    {version}
                  </Badge>
                </div>

                
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full"
                    onClick={() => window.open(backendUrl, "_blank")}
                  >
                    Open Build
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
