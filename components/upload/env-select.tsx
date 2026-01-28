"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Environment } from "../dashboard/dashboard";
import { apiFetch } from "../lib/api";
import { CreateEntityDialog } from "./dialog/CreateEntityDialog";

type Props = {
  value?: string;
  onChange: (value: number) => void;
  envs: Environment[];
  refreshEnvironemts: (projectId: number, envId?: number) => void;
  projectId?: number;
  showAddEnvironment: boolean
};

export function EnvironmentSelect({
  value,
  onChange,
  envs,
  refreshEnvironemts,
  projectId,
  showAddEnvironment
}: Props) {
  return (
    <div className="max-w-xs w-full flex flex-row gap-4">
      <Select
        value={value ?? ""}
        onValueChange={(id) => {
          if (!id) return;
          onChange(Number(id));
        }}
        disabled={envs.length == 0}
      >
        <SelectTrigger className="w-full max-w-sm">
          <SelectValue placeholder="Select Environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Environment</SelectLabel>
            {envs.map((env) => (
              <SelectItem key={env.id} value={String(env.id)}>
                {env.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {showAddEnvironment && (
        <CreateEntityDialog
          title="Create Environment"
          fields={[
            { name: "name", placeHolder: "Enter Environment Name" },
            { name: "slug", placeHolder: "Enter Slug" },
          ]}
          showAddButton={projectId == undefined || projectId == null}
          onSubmit={async ({ name, slug }) => {
            if (projectId == undefined || projectId == null) return;
            console.log(name + "- name");
            await apiFetch(`/projects/${projectId}/environments`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ name, slug }),
            });
            refreshEnvironemts(projectId);
          }}
        />
      )}
    </div>
  );
}
