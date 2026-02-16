const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE) {
  console.warn("NEXT_PUBLIC_API_BASE_URL is not set");
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;

  async function doFetch(): Promise<Response> {
    return fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  }

  let res = await doFetch();

  // If access expired, refresh and retry once
  if (res.status === 401) {
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });

    if (refreshRes.ok) {
      res = await doFetch();
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