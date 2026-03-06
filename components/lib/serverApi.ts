import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function buildCookieHeader() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

async function fetchWithCookies(path: string, init?: RequestInit) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }

  const cookieHeader = await buildCookieHeader();

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
  // 1st attempt
  let res = await fetchWithCookies(path, init);

  // If unauthorized, try refresh once then retry original request
  if (res.status === 401) {
    // Try refresh
    const refreshRes = await fetchWithCookies("/api/auth/refresh", {
      method: "POST",
    });

    // If refresh works, retry original request
    if (refreshRes.ok) {
      res = await fetchWithCookies(path, init);
    }
  }

  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  // Handle 204
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}