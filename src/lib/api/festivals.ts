import type {
  FestivalRepository,
  FestivalDetail,
  FestivalSummary,
  RecommendedFestival,
  Program,
  ListResponse,
  ApiResponse,
  Filters,
} from "../types";
import { apiGet, ApiError } from "./client";
import { validateFilters } from "../validation";
export function toQuery(filters: Filters) {
  const issue = validateFilters(filters);
  if (issue) throw new ApiError(422, issue, "INVALID_FILTER");
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
    else if (value) query.set(key, String(value));
  });
  return query.toString();
}
export const apiRepository: FestivalRepository = {
  list: (filters = {}, signal) =>
    apiGet<ListResponse<FestivalSummary>>(
      `/festivals?${toQuery(filters)}`,
      signal,
    ),
  recommendations: (filters = {}, signal) =>
    apiGet<ApiResponse<RecommendedFestival[]>>(
      `/festivals/recommendations?${toQuery(filters)}`,
      signal,
    ),
  detail: (id, signal) =>
    apiGet<ApiResponse<FestivalDetail>>(
      `/festivals/${encodeURIComponent(id)}`,
      signal,
    ),
  programs: (id, signal) =>
    apiGet<ApiResponse<Program[]>>(
      `/festivals/${encodeURIComponent(id)}/programs`,
      signal,
    ),
};
