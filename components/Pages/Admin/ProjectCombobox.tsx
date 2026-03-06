"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import { cn } from "@/components/lib/utils";

type Project = {
    id: number;
    name: string;
    slug: string;
};

export default function ProjectCombobox({
    projects,
    value,
    onChange,
    disabled,
}: {
    projects: Project[];
    value: number | null;
    onChange: (id: number | null) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = React.useState(false);
    const selected = projects.find((p) => p.id === value) ?? null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between"
                >
                    {selected ? `${selected.name} (${selected.slug})` : "Select project"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            {/* KEY FIX: match dropdown width with trigger */}
            <PopoverContent
                align="start"
                className="w-[--radix-popover-trigger-width] p-0"
            >
                <Command>
                    <CommandInput placeholder="Search project..." />
                    <CommandEmpty>No project found.</CommandEmpty>

                    {/* Make list scroll when many projects */}
                    <CommandGroup className="max-h-64 overflow-auto">
                        {projects.map((p) => (
                            <CommandItem
                                key={p.id}
                                value={`${p.name} ${p.slug}`}
                                onSelect={() => {
                                    onChange(p.id);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === p.id ? "opacity-100" : "opacity-0",
                                    )}
                                />
                                <span className="font-medium">{p.name}</span>
                                <span className="ml-2 text-xs text-muted-foreground">
                                    {p.slug}
                                </span>
                            </CommandItem>
                        ))}
                    </CommandGroup>

                    {value !== null && (
                        <div className="border-t p-2">
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => {
                                    onChange(null);
                                    setOpen(false);
                                }}
                            >
                                Clear selection
                            </Button>
                        </div>
                    )}
                </Command>
            </PopoverContent>
        </Popover>
    );
}