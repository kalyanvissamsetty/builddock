"use client";

import { useRouter } from "next/navigation";
import type { Me, ReviewDomain } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DOMAIN_LABELS, getDefaultRouteForDomain, useSelectedDomain } from "@/components/auth/domain";

type Props = {
  me: Me;
  className?: string;
};

export function DomainSwitcher({ me, className }: Props) {
  const router = useRouter();
  const { allowedDomains, selectedDomain, setSelectedDomain } = useSelectedDomain(me);

  if (allowedDomains.length <= 1) return null;

  function handleChange(value: string) {
    const nextDomain = value as ReviewDomain;
    setSelectedDomain(nextDomain);
    router.push(getDefaultRouteForDomain(me, nextDomain));
  }

  return (
    <Select value={selectedDomain} onValueChange={handleChange}>
      <SelectTrigger className={className ?? "w-full"}>
        <SelectValue placeholder="Select review domain" />
      </SelectTrigger>
      <SelectContent
        align="end"
        side="bottom"
        sideOffset={8}
        position="popper"
        collisionPadding={12}
        className="z-[100] min-w-[220px]"
      >
        {allowedDomains.map((domain) => (
          <SelectItem key={domain} value={domain}>
            {DOMAIN_LABELS[domain]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
