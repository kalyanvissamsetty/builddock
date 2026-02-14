"use client";
import { Project } from "../Pages/Shared/UploadBuild";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateEntityDialog } from "./dialog/CreateEntityDialog";
import { apiFetch } from "../lib/api";

type Props = {
  value?: string;
  onChange: (value: number) => void;
  projects: Project[];
  refreshProjects: (value?: number) => void;
  showAddProject: boolean;
};

export function ProjectSelect({
  value,
  onChange,
  projects,
  refreshProjects,
  showAddProject,
}: Props) {
  return (
    <div className="flex flex-row max-w-xs w-full gap-4">
      <Select
        value={value ?? ""}
        onValueChange={(id) => {
          if (!id) return;
          console.log("from project- " + id);
          onChange(Number(id));
        }}
        disabled={projects.length == 0}
      >
        <SelectTrigger className="w-full max-w-sm">
          <SelectValue placeholder="Select Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Projects</SelectLabel>
            {projects.map((project) => (
              <SelectItem key={project.id} value={String(project.id)}>
                {project.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {showAddProject && (
        <CreateEntityDialog
          title="Create Project"
          fields={[
            { name: "name", placeHolder: "Enter Project Name" },
            { name: "slug", placeHolder: "Enter Slug" },
          ]}
          showAddButton={false}
          onSubmit={async ({ name, slug }) => {
            console.log(name + "- name");
            await apiFetch("/projects", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ name, slug }),
            });
            refreshProjects();
          }}
        />
      )}
    </div>
  );
}
