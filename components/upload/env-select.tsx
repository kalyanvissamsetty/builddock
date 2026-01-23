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

export function EnvironmentSelect({ value, onChange }: Props) {
  return (
    <Select value={value??undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full max-w-sm">
        <SelectValue placeholder="Select Environment" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Environment</SelectLabel>
          <SelectItem value="production">Production</SelectItem>
          <SelectItem value="client">Client Testing</SelectItem>
          <SelectItem value="internal">Internal Testing</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
