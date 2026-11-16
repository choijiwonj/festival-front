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
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
  let response: Response;
  try {
    response = await fetch(`${base.replace(/\/$/, "")}${path}`, {
      signal,
      headers: { Accept: "application/json" },
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
  return response.json() as Promise<T>;
}
