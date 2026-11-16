import type { FestivalRepository, ApiResponse } from "../types";
import { festivals, programs, recommendations, toSummary } from "./data";
import { filterFestivals, validateFilters } from "../validation";
import { ApiError } from "../api/client";
export function createMockRepository(scenario = "success"): FestivalRepository {
  async function wait(signal?: AbortSignal) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", abort);
        resolve();
      }, 400);
      signal?.addEventListener("abort", abort, { once: true });
    });
    if (scenario === "error")
      throw new ApiError(
        503,
        "시연용 오류 상태입니다. 다시 시도해 주세요.",
        "MOCK_UNAVAILABLE",
        true,
      );
  }
  const envelope = <T>(data: T): ApiResponse<T> => ({
    data,
    meta: { requestId: "req_mock_demo" },
  });
  return {
    async list(filters = {}, signal) {
      await wait(signal);
      const issue = validateFilters(filters);
      if (issue) throw new ApiError(422, issue, "INVALID_FILTER");
      const items =
        scenario === "empty" ? [] : filterFestivals(festivals, filters);
      const offset = filters.cursor
        ? Number(filters.cursor.replace(/^mock_offset_/, ""))
        : 0;
      if (!Number.isInteger(offset) || offset < 0)
        throw new ApiError(400, "잘못된 페이지입니다.", "INVALID_CURSOR");
      const limit = filters.limit ?? 20;
      const data = items.slice(offset, offset + limit).map(toSummary);
      const hasNext = offset + limit < items.length;
      return {
        ...envelope(data),
        page: {
          hasNext,
          nextCursor: hasNext ? `mock_offset_${offset + limit}` : null,
        },
      };
    },
    async recommendations(filters = {}, signal) {
      await wait(signal);
      const issue = validateFilters(filters);
      if (issue) throw new ApiError(422, issue);
      return envelope(
        scenario === "empty"
          ? []
          : filterFestivals(recommendations, filters).slice(
              0,
              Math.min(filters.limit ?? 3, 10),
            ),
      );
    },
    async detail(id, signal) {
      await wait(signal);
      const f = festivals.find((f) => f.id === id);
      if (!f)
        throw new ApiError(404, "축제를 찾을 수 없어요.", "FESTIVAL_NOT_FOUND");
      return envelope(f);
    },
    async programs(id, signal) {
      await wait(signal);
      return {...envelope(programs[id] ?? []),page:{nextCursor:null,hasNext:false}};
    },
  };
}
