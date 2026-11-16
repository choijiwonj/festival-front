"use client";
import { useCallback, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { festivalRepository } from "@/lib/repository";
import { useResource } from "@/lib/use-resource";
import { validateFilters } from "@/lib/validation";
import { toQuery } from "@/lib/api/festivals";
import { categories, regions, type Filters, type Interest } from "@/lib/types";
import { FestivalRow, Loading, ErrorState, EmptyState } from "./ui";
function readFilters(key: string): Filters {
  const p = new URLSearchParams(key);
  return {
    q: p.get("q") ?? "",
    region: p.get("region") ?? "",
    from: p.get("from") ?? "",
    to: p.get("to") ?? "",
    interests: p.getAll("interests") as Interest[],
    sort: (p.get("sort") ?? "START_DATE_ASC") as Filters["sort"],
    cursor: p.get("cursor") ?? "",
    limit: 20,
  };
}
export function FestivalList() {
  const params = useSearchParams();
  const key = params.toString();
  return <ListContent key={key} query={key} />;
}
function ListContent({ query }: { query: string }) {
  const router = useRouter();
  const applied = readFilters(query);
  const [draft, setDraft] = useState<Filters>(applied);
  const [error, setError] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(
    Boolean(applied.region || applied.from || applied.to),
  );
  const result = useResource(
    useCallback(
      (signal: AbortSignal) =>
        festivalRepository.list(readFilters(query), signal),
      [query],
    ),
  );
  function navigate(filters: Filters) {
    const issue = validateFilters(filters);
    setError(issue);
    if (issue) return;
    router.replace(`/festivals?${toQuery(filters)}`, { scroll: false });
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    navigate({ ...draft, cursor: undefined });
  }
  function reset() {
    setDraft({});
    setError(null);
    router.replace("/festivals", { scroll: false });
  }
  return (
    <>
      <h1 className="page-title">내가 찾던 축제</h1>
      <form onSubmit={submit} className="space-y-4" role="search">
        <div className="search-box">
          <label className="sr-only" htmlFor="festival-query">
            축제명 또는 지역
          </label>
          <input
            id="festival-query"
            placeholder="축제명 또는 지역으로 검색"
            value={draft.q ?? ""}
            maxLength={100}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
          />
          <button aria-label="검색" type="submit">
            <Search size={20} />
          </button>
        </div>
        <div className="flex justify-between items-center gap-2">
          <div className="chips" aria-label="관심사 필터">
            {categories.map((c) => (
              <button
                key={c.label}
                type="button"
                className="chip"
                aria-pressed={
                  c.value
                    ? Boolean(applied.interests?.includes(c.value))
                    : !applied.interests?.length
                }
                onClick={() =>
                  navigate({
                    ...draft,
                    interests: c.value ? [c.value] : [],
                    cursor: undefined,
                  })
                }
              >
                {c.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="지역과 날짜 필터"
            aria-expanded={advanced}
            aria-controls="advanced-filters"
            onClick={() => setAdvanced(!advanced)}
          >
            <SlidersHorizontal size={19} />
          </button>
        </div>
        {advanced && (
          <div id="advanced-filters" className="filter-panel">
            <label>
              지역
              <select
                value={draft.region ?? ""}
                onChange={(e) => setDraft({ ...draft, region: e.target.value })}
              >
                <option value="">충남 전체</option>
                {Object.entries(regions).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <div className="date-grid">
              <label>
                시작일
                <input
                  type="date"
                  value={draft.from ?? ""}
                  onChange={(e) => setDraft({ ...draft, from: e.target.value })}
                />
              </label>
              <label>
                종료일
                <input
                  type="date"
                  value={draft.to ?? ""}
                  onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                />
              </label>
            </div>
            <label>
              정렬
              <select
                value={draft.sort ?? "START_DATE_ASC"}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    sort: e.target.value as Filters["sort"],
                  })
                }
              >
                <option value="START_DATE_ASC">개최일순</option>
                <option value="NAME_ASC">이름순</option>
              </select>
            </label>
            <button className="button" type="submit">
              조건 적용
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
      </form>
      <div className="result-summary">
        <p aria-live="polite">
          {applied.region
            ? regions[applied.region as keyof typeof regions]
            : "충남 전체"}{" "}
          ·{" "}
          {result.loading
            ? "찾는 중…"
            : `${result.data?.data.length ?? 0}개 표시`}
        </p>
        <button onClick={reset} type="button">
          초기화
        </button>
      </div>
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <ErrorState message={result.error.message} retry={result.retry} />
      ) : !result.data?.data.length ? (
        <EmptyState reset={reset} />
      ) : (
        <>
          <div className="space-y-4">
            {result.data.data.map((f) => (
              <FestivalRow key={f.id} festival={f} />
            ))}
          </div>
          {(applied.cursor || result.data.page.hasNext) && (
            <div className="pagination">
              <button
                disabled={!applied.cursor}
                onClick={() => navigate({ ...applied, cursor: undefined })}
              >
                처음으로
              </button>
              <button
                disabled={!result.data.page.hasNext}
                onClick={() =>
                  navigate({
                    ...applied,
                    cursor: result.data!.page.nextCursor ?? undefined,
                  })
                }
              >
                다음 축제
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
