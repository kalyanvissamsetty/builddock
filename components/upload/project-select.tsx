"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  value: string | null
  onChange: (value: string) => void
}

export function ProjectSelect({ value, onChange }: Props) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full max-w-sm">
        <SelectValue placeholder="Select Project" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Projects</SelectLabel>
          <SelectItem value="mbta">MBTA</SelectItem>
          <SelectItem value="mdu">MDU</SelectItem>
          <SelectItem value="pge">PG&E</SelectItem>
          <SelectItem value="vmi">VMI</SelectItem>
          <SelectItem value="eversource">Eversource</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
