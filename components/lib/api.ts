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

export function getApiBase() {
  let API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (typeof window !== "undefined") {
    const origin = window.location.origin;

    if (origin.includes("themosaiccompany")) {
      API_BASE = "https://preview-api.themosaiccompany.com:444";
    } else if (origin.includes("timsstudio")) {
      API_BASE = "https://api.timsstudio.tech";
    }
  }

  return API_BASE;
}

let refreshPromise: Promise<boolean> | null = null;

export function refreshAuthSession() {
  if (refreshPromise) return refreshPromise;

  const apiBase = getApiBase() ?? "";

  refreshPromise = fetch(`${apiBase}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const API_BASE = getApiBase() ?? "";

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
    const refreshed = await refreshAuthSession();
    if (refreshed) {
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

type UploadWithProgressOptions = {
  method?: "POST" | "PUT" | "PATCH";
  onProgress?: (progress: { loaded: number; total: number; percent: number }) => void;
};

function parseJsonResponse<T>(xhr: XMLHttpRequest): T {
  if (!xhr.responseText) return undefined as T;

  return JSON.parse(xhr.responseText) as T;
}

function uploadFormDataOnce<T>(
  path: string,
  body: FormData,
  options: UploadWithProgressOptions,
): Promise<T> {
  const apiBase = getApiBase() ?? "";

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method ?? "POST", `${apiBase}${path}`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      options.onProgress?.({
        loaded: event.loaded,
        total: event.total,
        percent: Math.round((event.loaded / event.total) * 100),
      });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(parseJsonResponse<T>(xhr));
        } catch {
          reject(new ApiError("Invalid server response", xhr.status));
        }
        return;
      }

      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // ignore non-json errors
      }

      reject(new ApiError(data?.message || `Request failed: ${xhr.status}`, xhr.status, data));
    };

    xhr.onerror = () => reject(new ApiError("Network error while uploading", xhr.status || 0));
    xhr.onabort = () => reject(new ApiError("Upload was cancelled", xhr.status || 0));
    xhr.send(body);
  });
}

export async function uploadFormDataWithProgress<T>(
  path: string,
  body: FormData,
  options: UploadWithProgressOptions = {},
): Promise<T> {
  try {
    return await uploadFormDataOnce<T>(path, body, options);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || path === "/api/auth/refresh") {
      throw error;
    }

    const refreshed = await refreshAuthSession();
    if (!refreshed) throw error;

    return uploadFormDataOnce<T>(path, body, options);
  }
}
