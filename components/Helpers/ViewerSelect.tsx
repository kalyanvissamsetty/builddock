"use client";

import { apiFetch } from "@/components/lib/api";
import { cn } from "@/components/lib/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useEffect, useState } from "react";

type Viewer = {
  id: number;
  email: string;
  name?: string | null;
  role?: string;
};

type Props = {
  value: number | null;
  onChange: (id: number) => void;
  className?: string;
};

export function ViewerSelect({ value, onChange, className }: Props) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadViewers() {
      setLoading(true);
      try {
        const data = await apiFetch<Viewer[]>("/api/admin/users?module=WEBGL");
        const nonAdmin = data.filter((u) => u.role === "VIEWER");
        if (mounted) setViewers(nonAdmin);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadViewers();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedViewer = viewers.find((v) => v.id === value) ?? null;

  return (
    <div className={cn("w-full", className)}>
      <Combobox
        items={viewers}
        value={selectedViewer}
        onValueChange={(viewer) => {
          if (!viewer) return;
          onChange(viewer.id);
        }}
        itemToStringLabel={(viewer) => viewer.name ?? viewer.email}
      >
        <ComboboxInput
          placeholder={loading ? "Loading viewers..." : "Select viewer"}
          disabled={loading}
          className="w-full"
        />

        <ComboboxContent>
          <ComboboxEmpty>No viewer found.</ComboboxEmpty>

          <ComboboxList>
            {(viewer) => (
              
              <ComboboxItem key={viewer.id} value={viewer}>
                {viewer.name ? `${viewer.name}` : viewer.email}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
