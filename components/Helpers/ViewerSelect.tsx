/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/components/lib/api";

export function ViewerSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number) => void;
}) {
  const [viewers, setViewers] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/api/admin/users").then((data) => {
      if (Array.isArray(data)) {
        setViewers(data.filter((u: any) => u && u.role === "VIEWER"));
      } else {
        setViewers([]);
      }
    });
  }, []);

  return (
    <Select
      value={value?.toString()}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select Viewer" />
      </SelectTrigger>
      <SelectContent>
        {viewers.map((v) => (
          <SelectItem key={v.id} value={v.id.toString()}>
            {v.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
