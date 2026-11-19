import { apiGet, apiRequest, ApiError, AUTH_EXPIRED_EVENT } from "./client";
import type { ApiResponse } from "../types";

export type ExportFormat = "PDF" | "PNG";
export type ExportRecord = {
  id: string; planId: string; planVersion: number; format: ExportFormat; dates: string[];
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  downloadUrl: string | null; filename: string | null; contentType: string | null;
  error: { code: string; message: string; retryable?: boolean } | null;
};
export type ExportResponse = ApiResponse<ExportRecord> & { meta: { pollAfterSeconds?: number } };

export function exportDates(available: string[], selected: string[]) {
  if (!selected.length) throw new Error("저장할 날짜를 하나 이상 선택해 주세요.");
  if (new Set(selected).size !== selected.length || selected.some((date) => !available.includes(date)))
    throw new Error("선택한 날짜를 다시 확인해 주세요.");
  return available.filter((date) => selected.includes(date));
}

export function exportOutcome(record: ExportRecord) {
  if (record.status === "FAILED") return "failed";
  if (record.status !== "SUCCEEDED") return "pending";
  return record.filename && record.contentType && record.downloadUrl ? "ready" : "invalid";
}

export function safeExportFilename(name: string | null, contentType: string) {
  const extension = contentType.includes("pdf") ? "pdf" : contentType.includes("zip") ? "zip" : "png";
  const stem = (name || "여행계획").replace(/[\\/\u0000-\u001f\u007f]/g, "_").replace(/\.(pdf|png|zip)$/i, "").replace(/^\.+/, "").slice(0, 140);
  return `${stem || "여행계획"}.${extension}`;
}

export const exportApi = {
  create: (planId: string, version: number, format: ExportFormat, dates: string[], csrfToken: string | null,
           idempotencyKey: string, signal?: AbortSignal) =>
    apiRequest<ApiResponse<{ exportId: string; jobId: string }>>(`/trip-plans/${encodeURIComponent(planId)}/exports`, {
      method: "POST", json: { version, format, dates }, csrfToken, idempotencyKey, signal,
    }),
  status: (id: string, signal?: AbortSignal) => apiGet<ExportResponse>(`/exports/${encodeURIComponent(id)}`, signal),
};

export async function exportFile(id: string, expectedType: string, signal?: AbortSignal) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
  let response: Response;
  try {
    response = await fetch(`${base.replace(/\/$/, "")}/exports/${encodeURIComponent(id)}/download`, {
      credentials: "same-origin", cache: "no-store", signal,
      headers: { Accept: "application/pdf, image/png, application/zip" },
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, "파일을 내려받지 못했어요. 연결을 확인하고 다시 시도해 주세요.", "NETWORK_ERROR", true);
  }
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    const payload = await response.json().catch(() => null);
    throw new ApiError(response.status, payload?.error?.message ?? "파일을 내려받지 못했어요.",
      payload?.error?.code, payload?.error?.retryable, payload?.error?.fields, payload?.meta?.requestId);
  }
  const mime = response.headers.get("content-type")?.split(";")[0].trim();
  if (!["application/pdf", "image/png", "application/zip"].includes(mime || "") || mime !== expectedType)
    throw new ApiError(502, "파일 형식이 올바르지 않아요. 다시 만들어 주세요.", "EXPORT_FILE_INVALID");
  const blob = await response.blob();
  if (!blob.size) throw new ApiError(502, "빈 파일이 반환됐어요. 다시 만들어 주세요.", "EXPORT_FILE_EMPTY");
  return blob;
}
