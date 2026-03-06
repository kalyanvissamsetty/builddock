import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function buildCookieHeader() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

function mergeSetCookieIntoCookieHeader(existing: string, setCookieHeader: string | null) {
  if (!setCookieHeader) return existing;

  // set-cookie can be multiple cookies; Next fetch may combine them.
  // We only need name=value parts.
  const parts = setCookieHeader
    .split(/,(?=[^;]+=[^;]+)/g) // split cookies safely
    .map((c) => c.split(";")[0].trim()) // keep name=value
    .filter(Boolean);

  // Merge into map
  const map = new Map<string, string>();
  existing
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const idx = pair.indexOf("=");
      if (idx > 0) map.set(pair.slice(0, idx), pair.slice(idx + 1));
    });

  for (const nv of parts) {
    const idx = nv.indexOf("=");
    if (idx > 0) map.set(nv.slice(0, idx), nv.slice(idx + 1));
  }

  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function fetchWithCookieHeader(path: string, cookieHeader: string, init?: RequestInit) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });
}

export async function serverApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // 1) initial cookies from incoming request
  let cookieHeader = await buildCookieHeader();

  // 2) first attempt
  let res = await fetchWithCookieHeader(path, cookieHeader, init);

  // 3) if unauthorized, refresh once
  if (res.status === 401) {
    const refreshRes = await fetchWithCookieHeader("/api/auth/refresh", cookieHeader, {
      method: "POST",
    });

    if (refreshRes.ok) {
      // IMPORTANT: merge new cookies set by backend refresh into our cookie header for retry
      const setCookie = refreshRes.headers.get("set-cookie");
      cookieHeader = mergeSetCookieIntoCookieHeader(cookieHeader, setCookie);

      // retry original request with refreshed cookies
      res = await fetchWithCookieHeader(path, cookieHeader, init);
    }
  }

  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch { }
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}