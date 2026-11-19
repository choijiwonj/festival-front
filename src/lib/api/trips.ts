import type { ApiResponse, ListResponse } from "../types";
import type {
  Location,
  TripInput,
  ValidationResult,
  Job,
  Place,
  RequestSummary,
} from "../trips";
import { apiGet, apiRequest } from "./client";
export const tripApi = {
  locations: (q: string, signal?: AbortSignal) =>
    apiGet<ApiResponse<Location[]>>(
      `/locations/search?q=${encodeURIComponent(q)}&limit=5`,
      signal,
    ),
  places: (
    festivalId: string,
    q: string,
    cursor?: string,
    signal?: AbortSignal,
  ) =>
    apiGet<ListResponse<Place>>(
      `/places?festivalId=${encodeURIComponent(festivalId)}&q=${encodeURIComponent(q)}&limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
      signal,
    ),
  validate: (input: TripInput, csrfToken: string | null) =>
    apiRequest<ApiResponse<ValidationResult>>("/trip-requests/validate", {
      method: "POST",
      json: input,
      csrfToken,
    }),
  create: (
    input: TripInput,
    csrfToken: string | null,
    idempotencyKey: string,
  ) =>
    apiRequest<
      ApiResponse<{ jobId: string; requestId: string; statusUrl: string }>
    >("/trip-requests", {
      method: "POST",
      json: input,
      csrfToken,
      idempotencyKey,
    }),
  job: (id: string, signal?: AbortSignal) =>
    apiGet<ApiResponse<Job>>(`/jobs/${encodeURIComponent(id)}`, signal),
  active: (signal?: AbortSignal) =>
    apiGet<ListResponse<RequestSummary>>(
      "/me/trip-requests?status=ACTIVE&limit=20",
      signal,
    ),
  regenerate: (
    id: string,
    version: number,
    input: TripInput,
    csrfToken: string | null,
    idempotencyKey: string,
  ) =>
    apiRequest<ApiResponse<{ jobId: string }>>(
      `/trip-plans/${encodeURIComponent(id)}/regenerations`,
      {
        method: "POST",
        json: { ...input, baseVersion: version },
        csrfToken,
        idempotencyKey,
      },
    ),
};
