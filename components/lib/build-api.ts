import { apiFetch } from "./api";
import { Project, Environment, Version } from "@/types";
export async function fetchProjects() {
  return apiFetch<Project[]>("/projects");
}

export async function fetchEnvironments(projectId: number) {
  return apiFetch<Environment[]>(`/projects/${projectId}/environments`);
}

export async function fetchVersions(projectId: number, envId: number) {
  return apiFetch<Version[]>(
    `/projects/${projectId}/environments/${envId}/versions`
  );
}
