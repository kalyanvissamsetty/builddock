const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE) {
  console.warn("NEXT_PUBLIC_API_BASE_URL is not set");
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const isFormData = init?.body instanceof FormData;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    let code: string | undefined;

    try {
      const data = await res.json();
      message = data?.message || message;
      code = data?.code;
    } catch {
      // ignore JSON parse failure
    }

    const error = new Error(message) as Error & { code?: string };
    if (code) {
      error.code = code;
    }

    throw error;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}