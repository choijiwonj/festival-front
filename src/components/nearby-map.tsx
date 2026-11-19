"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { exploreApi, validMapBounds, type MapBounds, type MapPlace } from "@/lib/explore";
import { useResource } from "@/lib/use-resource";
import { ErrorState } from "./ui";
import "leaflet/dist/leaflet.css";

const areas = [
  { label: "태안·안면도", lat: 36.745, lng: 126.298 },
  { label: "보령·대천", lat: 36.309, lng: 126.515 },
  { label: "공주", lat: 36.462, lng: 127.12 },
  { label: "부여", lat: 36.281, lng: 126.912 },
];
type Center = { lat: number; lng: number; label: string; revision?: number };
export function NearbyMap() {
  const [center, setCenter] = useState<Center>(areas[0]);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [extra, setExtra] = useState<MapPlace[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [moreBusy, setMoreBusy] = useState(false);
  const [moreError, setMoreError] = useState("");
  const requestVersion = useRef(0);
  const lastBounds = useRef<MapBounds | null>(null);
  const onBounds = useCallback((value: MapBounds) => {
    const previous = lastBounds.current;
    if (previous && (Object.keys(value) as (keyof MapBounds)[]).every((key) => Math.abs(previous[key] - value[key]) < 0.000001)) return;
    lastBounds.current = value;
    requestVersion.current += 1;
    setExtra([]); setNextCursor(null); setMoreError(""); setSelected(null);
    setBounds(value);
  }, []);
  const valid = bounds !== null && validMapBounds(bounds);
  const result = useResource(useCallback((signal: AbortSignal) => {
    if (!bounds || !validMapBounds(bounds)) return Promise.resolve(null);
    return exploreApi.places(bounds, query, signal);
  }, [bounds, query]));
  const places = useMemo(() => result.data?.data ? [...result.data.data, ...extra] : [], [result.data, extra]);
  const cursor = extra.length ? nextCursor : result.data?.page.nextCursor;
  async function loadMore() {
    if (!bounds || !cursor || moreBusy) return;
    const version = requestVersion.current;
    setMoreBusy(true); setMoreError("");
    try {
      const response = await exploreApi.places(bounds, query, undefined, cursor);
      if (version !== requestVersion.current) return;
      setExtra((old) => [...old, ...response.data]);
      setNextCursor(response.page.nextCursor);
    } catch (error) {
      if (version === requestVersion.current) setMoreError(error instanceof Error ? error.message : "더 불러오지 못했어요.");
    } finally { setMoreBusy(false); }
  }
  function locate() {
    if (!navigator.geolocation) { setLocationMessage("이 브라우저는 현재 위치 확인을 지원하지 않아요."); return; }
    setLocating(true); setLocationMessage("");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setCenter({ lat: coords.latitude, lng: coords.longitude, label: "내 주변", revision: Date.now() });
      setLocating(false);
    }, () => {
      setLocationMessage("현재 위치를 확인하지 못했어요. 위치 권한을 확인하거나 지역을 선택해 주세요.");
      setLocating(false);
    }, { timeout: 10000, maximumAge: 60000 });
  }
  return <>
    <p className="eyebrow">가까운 곳에서 찾는 작은 즐거움</p>
    <h1 className="page-title">주변에 뭐가 있을까요?</h1>
    <p className="muted mt-2">지도 안의 관광지와 체험 장소만 모았어요.</p>
    <form className="explore-search mt-5" onSubmit={(event) => {
      event.preventDefault(); requestVersion.current += 1; setExtra([]); setNextCursor(null); setMoreError(""); setQuery(input.trim());
    }}>
      <Search size={19} aria-hidden="true" />
      <input aria-label="주변 놀거리 검색" placeholder="박물관, 해변, 체험 장소 검색" maxLength={100} value={input} onChange={(event) => setInput(event.target.value)} />
      <button type="submit">검색</button>
    </form>
    <div className="explore-areas mt-3" role="group" aria-label="지도 지역">
      {areas.map((area) => <button type="button" className="chip" key={area.label}
        aria-pressed={center.label === area.label} onClick={() => setCenter({ ...area, revision: Date.now() })}>{area.label}</button>)}
    </div>
    <div className="explore-map-wrap mt-4">
      <MapCanvas center={center} places={places} selected={selected} onSelect={setSelected} onBounds={onBounds} />
      <button type="button" className="locate-button" disabled={locating} onClick={locate}>
        <LocateFixed size={17} />{locating ? "확인 중" : "내 주변"}
      </button>
    </div>
    {locationMessage && <p role="status" className="muted mt-2">{locationMessage}</p>}
    <p className="muted mt-2">{center.label === "태안·안면도" ? "처음에는 태안 지도를 보여드려요. " : ""}지도를 움직이면 주변 목록이 바뀝니다.</p>
    <section className="section" aria-live="polite" aria-busy={result.loading || moreBusy}>
      <div className="explore-list-heading"><h2>지도 속 놀거리</h2><span className="eyebrow">{places.length}곳 표시</span></div>
      {!bounds ? <p className="state-card mt-3">지도를 준비하고 있어요.</p> : !valid ? <p className="state-card mt-3">지도를 조금 더 확대해 주세요. 한 번에 약 49km 이내를 조회할 수 있어요.</p> : result.loading ? <p className="state-card mt-3">주변 놀거리를 찾고 있어요.</p> : result.error ? <ErrorState message={result.error.message} retry={result.retry} /> : !places.length ? <div className="state-card mt-3"><h3>이 주변에는 등록된 놀거리가 없어요.</h3><p className="muted mt-2">지도를 옮기거나 검색어를 바꿔 보세요. 현재 DB에 등록된 장소를 조회합니다.</p></div> : <div className="space-y-3 mt-3">
        {places.map((place, index) => <button type="button" key={place.id} className={`map-place-card ${selected === place.id ? "selected" : ""}`}
          aria-pressed={selected === place.id} onClick={() => setSelected(place.id)}>
          <span className="map-place-index">{index + 1}</span>
          <span><span className="eyebrow">{place.category === "EXPERIENCE" ? "체험" : "관광·놀거리"}</span><strong>{place.name}</strong><span className="muted">{place.address}</span></span>
          <MapPin size={19} aria-hidden="true" />
        </button>)}
        {cursor && <button type="button" className="button secondary w-full" onClick={loadMore} disabled={moreBusy}>{moreBusy ? "불러오는 중…" : "주변 장소 더 보기"}</button>}
        {moreError && <p role="alert">{moreError}</p>}
      </div>}
    </section>
  </>;
}

function MapCanvas({ center, places, selected, onSelect, onBounds }: {
  center: Center; places: MapPlace[]; selected: string | null;
  onSelect: (id: string) => void; onBounds: (bounds: MapBounds) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const library = useRef<typeof import("leaflet") | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const markers = useRef<globalThis.Map<string, import("leaflet").Marker>>(new globalThis.Map());
  const initial = useRef(center);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let instance: LeafletMap | undefined;
    let resize: ResizeObserver | undefined;
    setReady(false); setError("");
    import("leaflet").then((L) => {
      if (disposed || !container.current) return;
      library.current = L;
      instance = L.map(container.current, { scrollWheelZoom: false }).setView([initial.current.lat, initial.current.lng], 12);
      map.current = instance;
      const tiles = L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(instance);
      let errors = 0;
      tiles.on("tileerror", () => { if (!disposed && ++errors >= 3) setError("지도 배경을 불러오지 못했어요. 네트워크를 확인해 주세요. 장소 목록은 계속 사용할 수 있어요."); });
      const report = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (disposed || !instance) return;
          const b = instance.getBounds();
          onBounds({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() });
        }, 350);
      };
      instance.on("moveend", report);
      layer.current = L.layerGroup().addTo(instance);
      resize = new ResizeObserver(() => instance?.invalidateSize());
      resize.observe(container.current);
      report(); setReady(true);
    }).catch(() => { if (!disposed) setError("지도 모듈을 불러오지 못했어요. 다시 시도해 주세요."); });
    return () => { disposed = true; clearTimeout(timer); resize?.disconnect(); instance?.remove(); map.current = null; layer.current = null; };
  }, [onBounds, attempt]);
  useEffect(() => {
    if (ready && map.current) map.current.setView([center.lat, center.lng], 12);
    initial.current = center;
  }, [center, ready]);
  useEffect(() => {
    const L = library.current;
    if (!ready || !L || !layer.current) return;
    layer.current.clearLayers(); markers.current.clear();
    places.forEach((place, index) => {
      if (![place.lat, place.lng].every(Number.isFinite)) return;
      const content = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = place.name;
      const address = document.createElement("p"); address.textContent = place.address;
      content.append(title, address);
      const marker = L.marker([place.lat, place.lng], {
        icon: L.divIcon({ className: "explore-pin", html: `<span>${index + 1}</span>`, iconSize: [32, 36], iconAnchor: [16, 36] }),
        title: place.name, alt: place.name,
      }).bindPopup(content).on("click", () => onSelect(place.id)).addTo(layer.current!);
      markers.current.set(place.id, marker);
    });
  }, [places, onSelect, ready]);
  useEffect(() => { if (selected) markers.current.get(selected)?.openPopup(); }, [selected, places]);
  return <>
    <div ref={container} className="explore-map" aria-label="주변 관광·체험 장소 지도" />
    {!ready && !error && <p className="map-overlay" role="status">지도를 불러오고 있어요.</p>}
    {error && <div className="map-error" role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt((n) => n + 1)}>지도 다시 연결</button></div>}
  </>;
}
