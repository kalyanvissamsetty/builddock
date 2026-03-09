/* eslint-disable @typescript-eslint/no-explicit-any */
export class ApiError extends Error {
  status: number;
  code?: string;
  redirectTo?: string;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.code = data?.code;
    this.redirectTo = data?.redirectTo;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;

  let API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined" && window.origin.includes("themosaiccompany")) {
    API_BASE = "https://preview-api.themosaiccompany.com:444";
  }
  else if (typeof window !== "undefined" && window.origin.includes("timsstudio")) {
    API_BASE = "https://api.timsstudio.tech";
  }

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
  if (res.status === 401 && path !== "/api/auth/refresh" && path !== "/api/auth/logout") {
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
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // ignore
    }

    const msg = data?.message || `Request failed: ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}