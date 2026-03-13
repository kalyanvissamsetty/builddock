/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import type { Project, Environment, Version } from "@/types";
import { fetchProjects, fetchEnvironments, fetchVersions } from "@/components/lib/build-api";
import { ProjectSelect } from "../upload/project-select";
import { EnvironmentSelect } from "../upload/env-select";
import { VersionSelect } from "../upload/version-select";

export type BuildSelectValue = {
    projectId: number | null;
    envId: number | null;
    versionId: number | null;
};

type BuildSelectProps = {
    value: BuildSelectValue;
    onChange: (next: BuildSelectValue) => void;
    disabled?: boolean;
};

export default function BuildSelect({ value, onChange, disabled }: BuildSelectProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [envs, setEnvs] = useState<Environment[]>([]);
    const [versions, setVersions] = useState<Version[]>([]);

    // Load projects once
    useEffect(() => {
        fetchProjects()
            .then((p) => setProjects(Array.isArray(p) ? p : []))
            .catch(() => setProjects([]));
    }, []);

    // Load environments when project changes
    useEffect(() => {
        const projectId = value.projectId;
        if (!projectId) {
            setEnvs([]);
            setVersions([]);
            return;
        }

        fetchEnvironments(projectId)
            .then((e) => setEnvs(Array.isArray(e) ? e : []))
            .catch(() => setEnvs([]));
    }, [value.projectId]);

    // Load versions when env changes (and project exists)
    useEffect(() => {
        const projectId = value.projectId;
        const envId = value.envId;

        if (!projectId || !envId) {
            setVersions([]);
            return;
        }

        fetchVersions(projectId, envId)
            .then((v) => setVersions(Array.isArray(v) ? v : []))
            .catch(() => setVersions([]));
    }, [value.projectId, value.envId]);

    function onProjectChange(id: number) {
        // Reset downstream selections here (not in useEffect)
        onChange({ projectId: id, envId: null, versionId: null });
    }

    function onEnvChange(id: number) {
        // Reset downstream version here (not in useEffect)
        onChange({ projectId: value.projectId, envId: id, versionId: null });
    }

    function onVersionChange(id: number) {
        onChange({ projectId: value.projectId, envId: value.envId, versionId: id });
    }

    return (
        <div className="flex flex-col gap-6">
            <ProjectSelect
                value={value.projectId != null ? String(value.projectId) : undefined}
                onChange={onProjectChange}
                projects={projects}
                refreshProjects={async () => {
                    const p = await fetchProjects();
                    setProjects(Array.isArray(p) ? p : []);
                }}
                showAddProject={false}
            />

            <EnvironmentSelect
                value={value.envId != null ? String(value.envId) : undefined}
                onChange={onEnvChange}
                envs={envs}
                refreshEnvironemts={async (projectId?: number) => {
                    if (!projectId) {
                        setEnvs([]);
                        return;
                    }
                    const e = await fetchEnvironments(projectId);
                    setEnvs(Array.isArray(e) ? e : []);
                }}
                projectId={value.projectId ?? undefined}
                showAddEnvironment={false}
            />

            <VersionSelect
                value={value.versionId != null ? String(value.versionId) : undefined}
                onChange={onVersionChange}
                versions={versions}
                projectId={value.projectId ?? undefined}
                envId={value.envId ?? undefined}
                refreshVersions={async (projectId?: number, envId?: number) => {
                    if (!projectId || !envId) {
                        setVersions([]);
                        return;
                    }
                    const v = await fetchVersions(projectId, envId);
                    setVersions(Array.isArray(v) ? v : []);
                }}
                showAddVersion={false}
            />
        </div>
    );
}