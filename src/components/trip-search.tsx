"use client";
import { useEffect, useRef, useState } from "react";
import { tripApi } from "@/lib/api/trips";
import type { Location, Place } from "@/lib/trips";
function useSearch<T>() {
  const [items, setItems] = useState<T[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [searched, setSearched] = useState(false);
  const request = useRef<AbortController | null>(null),
    sequence = useRef(0);
  function clear() {
    sequence.current++;
    request.current?.abort();
    setItems([]);
    setBusy(false);
    setError("");
    setSearched(false);
  }
  useEffect(
    () => () => {
      sequence.current++;
      request.current?.abort();
    },
    [],
  );
  async function run(loader: (signal: AbortSignal) => Promise<T[]>) {
    request.current?.abort();
    const current = ++sequence.current;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    setItems([]);
    setSearched(false);
    try {
      const found = await loader(controller.signal);
      if (sequence.current === current) {
        setItems(found);
        setSearched(true);
      }
    } catch (e) {
      if (sequence.current === current && !controller.signal.aborted)
        setError(
          e instanceof Error
            ? e.message
            : "검색하지 못했어요. 다시 시도해 주세요.",
        );
    } finally {
      if (sequence.current === current) setBusy(false);
    }
  }
  return { items, busy, error, searched, clear, run };
}
export function OriginPicker({
  value,
  onChange,
}: {
  value: Location | null;
  onChange: (value: Location | null) => void;
}) {
  const [q, setQ] = useState(value?.label ?? "");
  const search = useSearch<Location>();
  useEffect(() => {
    if (value) setQ(value.label);
  }, [value]);
  function run() {
    if (q.trim().length < 2 || q.trim().length > 100) return;
    void search.run(
      async (signal) => (await tripApi.locations(q.trim(), signal)).data,
    );
  }
  return (
    <section className="trip-search" aria-labelledby="origin-title">
      <h2 id="origin-title">출발지</h2>
      <p className="muted mt-1">장소를 검색한 뒤 결과에서 선택해 주세요.</p>
      <div className="trip-search-input">
        <input
          aria-label="출발지 검색어"
          placeholder="예: 천안아산역"
          value={q}
          maxLength={100}
          onChange={(e) => {
            setQ(e.target.value);
            search.clear();
            if (value) onChange(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run();
            }
          }}
        />
        <button
          type="button"
          className="button secondary"
          disabled={search.busy || q.trim().length < 2}
          onClick={run}
        >
          {search.busy ? "검색 중…" : "검색"}
        </button>
      </div>
      {value && (
        <p role="status" className="trip-selected">
          선택한 출발지 · {value.label}
        </p>
      )}
      {search.busy && (
        <p role="status" className="muted">
          출발지를 찾고 있어요.
        </p>
      )}
      {search.error && (
        <p role="alert" className="field-error">
          {search.error}
        </p>
      )}
      {search.searched && search.items.length === 0 && (
        <p role="status" className="muted">
          검색 결과가 없어요. 다른 장소 이름으로 검색해 주세요.
        </p>
      )}
      <div className="trip-search-results">
        {search.items.map((item) => (
          <button
            key={item.locationId}
            type="button"
            aria-pressed={value?.locationId === item.locationId}
            onClick={() => {
              onChange(item);
              search.clear();
            }}
          >
            <strong>{item.label}</strong>
            <span>이 출발지 선택</span>
          </button>
        ))}
      </div>
    </section>
  );
}
export function PlacePicker({
  festivalId,
  selected,
  onChange,
}: {
  festivalId: string;
  selected: Place[];
  onChange: (places: Place[]) => void;
}) {
  const [q, setQ] = useState(""),
    [cursor, setCursor] = useState<string | null>(null);
  const search = useSearch<Place>();
  function run(next?: string) {
    void search.run(async (signal) => {
      const found = await tripApi.places(festivalId, q.trim(), next, signal);
      if (!signal.aborted) setCursor(found.page.nextCursor);
      return found.data;
    });
  }
  function toggle(item: Place) {
    onChange(
      selected.some((p) => p.id === item.id)
        ? selected.filter((p) => p.id !== item.id)
        : [...selected, item],
    );
  }
  return (
    <section className="trip-search" aria-labelledby="place-title">
      <h2 id="place-title">
        꼭 들를 장소 <span className="muted">선택 · 최대 10개</span>
      </h2>
      <p className="muted mt-1">축제장 반경 5km 안의 등록된 장소를 찾아요.</p>
      <div className="trip-search-input">
        <input
          aria-label="필수 장소 검색어"
          placeholder="장소 이름 또는 주소"
          maxLength={100}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            search.clear();
            setCursor(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run();
            }
          }}
        />
        <button
          type="button"
          className="button secondary"
          disabled={search.busy}
          onClick={() => run()}
        >
          {search.busy ? "검색 중…" : "찾기"}
        </button>
      </div>
      {selected.length > 0 && (
        <div className="chips mt-2">
          {selected.map((p) => (
            <button
              type="button"
              key={p.id}
              className="chip"
              aria-label={`${p.name} 선택 해제`}
              onClick={() => toggle(p)}
            >
              {p.name} ×
            </button>
          ))}
        </div>
      )}
      {search.error && (
        <p role="alert" className="field-error">
          {search.error}
        </p>
      )}
      {search.searched && !search.items.length && (
        <p className="muted" role="status">
          해당 범위에 등록된 장소가 없어요.
        </p>
      )}
      <div className="trip-search-results">
        {search.items.map((item) => {
          const active = selected.some((p) => p.id === item.id);
          return (
            <button
              type="button"
              key={item.id}
              aria-pressed={active}
              disabled={!active && selected.length >= 10}
              onClick={() => toggle(item)}
            >
              <strong>{item.name}</strong>
              <span>
                {item.address}
                {item.distanceM !== null
                  ? ` · ${Math.round(item.distanceM)}m`
                  : ""}
              </span>
              <span>{active ? "선택됨" : "일정에 추가"}</span>
            </button>
          );
        })}
      </div>
      {cursor && (
        <button
          type="button"
          className="text-link"
          disabled={search.busy}
          onClick={() => run(cursor)}
        >
          다음 장소 보기
        </button>
      )}
    </section>
  );
}
