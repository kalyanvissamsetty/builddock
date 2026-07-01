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
import { apiFetch } from "../lib/api";
import { CreateEntityDialog } from "./dialog/CreateEntityDialog";
import { Version } from "@/types";

type Props = {
  value?: string;
  onChange: (value: number) => void;
  versions: Version[];
  projectId?: number;
  envId?: number;
  refreshVersions: (projectId: number, envId: number) => void;
  showAddVersion: boolean;
};

export function VersionSelect({
  value,
  onChange,
  versions,
  projectId,
  envId,
  refreshVersions,
  showAddVersion,
}: Props) {
  const isDisabled = versions.length === 0 || !projectId || !envId;
  return (
    <div className="max-w-xs w-full flex flex-row gap-4 ">
      <Select
        value={value ?? ""}
        onValueChange={(id) => {
          if (!id) return;
          onChange(Number(id));
        }}
        disabled={isDisabled}
      >
        <SelectTrigger className="w-full max-w-sm">
          <SelectValue placeholder="Select Version" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Version</SelectLabel>
            {versions.map((version) => (
              <SelectItem key={version.id} value={String(version.id)}>
                <div className="flex flex-row items-center">
                  <h3>{version.name}</h3>
                  {version.isActive && (
                    <div className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      Active
                    </div>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {showAddVersion && (
        <CreateEntityDialog
          title="Create Version"
          fields={[{ name: "name", placeHolder: "Enter Version Name" }]}
          pathSafeFields={["name"]}
          showAddButton={
            projectId == undefined ||
            projectId == null ||
            envId == undefined ||
            envId == null
          }
          onSubmit={async ({ name, slug }) => {
            if (
              projectId == undefined ||
              projectId == null ||
              envId == undefined ||
              envId == null
            )
              return;
            await apiFetch(
              `/projects/${projectId}/environments/${envId}/versions`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, slug }),
              },
            );
            refreshVersions(projectId, envId);
          }}
        />
      )}
    </div>
  );
}
