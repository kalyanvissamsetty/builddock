"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AccessRole, Me, ReviewDomain } from "@/types";

export const DOMAIN_STORAGE_KEY = "bd_selected_domain";
export const DOMAIN_CHANGED_EVENT = "bd-domain-changed";

export const DOMAIN_LABELS: Record<ReviewDomain, string> = {
  WEBGL: "Unity WebGL Reviews",
  GRAPHICS: "Graphic Reviews",
};

export function getAllowedDomains(me: Me | null): ReviewDomain[] {
  if (!me) return [];

  const modules = (me.moduleAccess ?? [])
    .map((access) => access.module)
    .filter((module): module is ReviewDomain => module === "WEBGL" || module === "GRAPHICS");

  return Array.from(new Set(modules));
}

export function getDomainRole(me: Me, domain: ReviewDomain): AccessRole | null {
  const moduleRole = me.moduleAccess?.find((access) => access.module === domain)?.role?.key;
  return moduleRole ?? null;
}

export function getDefaultRouteForDomain(me: Me, domain: ReviewDomain) {
  if (domain === "GRAPHICS") return "/viewtickets";
  return getDomainRole(me, "WEBGL") === "VIEWER" ? "/mybuilds" : "/allbuilds";
}

export function getEntryRouteForUser(me: Me) {
  const domains = getAllowedDomains(me);
  if (domains.length > 1) return "/profileselection";
  return getDefaultRouteForDomain(me, domains[0] ?? "WEBGL");
}

export function readStoredDomain() {
  try {
    const value = localStorage.getItem(DOMAIN_STORAGE_KEY);
    return value === "GRAPHICS" || value === "WEBGL" ? value : null;
  } catch {
    return null;
  }
}

export function persistSelectedDomain(domain: ReviewDomain) {
  try {
    localStorage.setItem(DOMAIN_STORAGE_KEY, domain);
    window.dispatchEvent(new CustomEvent(DOMAIN_CHANGED_EVENT, { detail: domain }));
  } catch {
    // ignore
  }
}

export function useSelectedDomain(me: Me | null) {
  const allowedDomains = useMemo(() => getAllowedDomains(me), [me]);
  const [selectedDomain, setSelectedDomainState] = useState<ReviewDomain>(() => readStoredDomain() ?? "WEBGL");

  useEffect(() => {
    const stored = readStoredDomain();
    const next = stored && allowedDomains.includes(stored) ? stored : allowedDomains[0] ?? "WEBGL";
    setSelectedDomainState(next);
    if (allowedDomains.length > 0 && stored !== next) persistSelectedDomain(next);
  }, [allowedDomains]);

  useEffect(() => {
    function syncDomain(event?: Event) {
      const detail = event instanceof CustomEvent ? event.detail : null;
      const next = detail === "GRAPHICS" || detail === "WEBGL" ? detail : readStoredDomain();
      if (next && allowedDomains.includes(next)) setSelectedDomainState(next);
    }

    window.addEventListener(DOMAIN_CHANGED_EVENT, syncDomain);
    window.addEventListener("storage", syncDomain);
    return () => {
      window.removeEventListener(DOMAIN_CHANGED_EVENT, syncDomain);
      window.removeEventListener("storage", syncDomain);
    };
  }, [allowedDomains]);

  const setSelectedDomain = useCallback((domain: ReviewDomain) => {
    if (!allowedDomains.includes(domain)) return;
    setSelectedDomainState(domain);
    persistSelectedDomain(domain);
  }, [allowedDomains]);

  return { allowedDomains, selectedDomain, setSelectedDomain };
}
