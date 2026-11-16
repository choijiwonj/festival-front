export const AUTH_EXPIRED_EVENT = "festival:session-expired";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "UNKNOWN",
    public retryable = false,
    public fields: { path: string; reason: string }[] = [],
    public requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export async function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  return apiRequest<T>(path, { signal });
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    json?: unknown;
    csrfToken?: string | null;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.json !== undefined) headers["Content-Type"] = "application/json";
  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    if (!options.csrfToken)
      throw new ApiError(
        401,
        "로그인 상태를 다시 확인해 주세요.",
        "UNAUTHENTICATED",
      );
    headers["X-CSRF-Token"] = options.csrfToken;
  }
  let response: Response;
  try {
    response = await fetch(`${base.replace(/\/$/, "")}${path}`, {
      signal: options.signal,
      method,
      headers,
      body:
        options.json === undefined ? undefined : JSON.stringify(options.json),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      0,
      "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
      "NETWORK_ERROR",
      true,
    );
  }
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined")
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    const payload = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      payload?.error?.message ?? "정보를 불러오지 못했어요.",
      payload?.error?.code,
      payload?.error?.retryable,
      payload?.error?.fields,
      payload?.meta?.requestId,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
