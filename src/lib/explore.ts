import { apiGet } from "./api/client";
import type { ApiResponse, ListResponse, Region } from "./types";

export type MapBounds = { west: number; south: number; east: number; north: number };
export type MapPlace = {
  id: string; name: string; category: string; lat: number; lng: number;
  address: string; thumbnailUrl: string | null; distanceM: number | null;
};
export function placesUrl(bounds: MapBounds, query = "", cursor?: string) {
  const params = new URLSearchParams({
    bbox: [bounds.west, bounds.south, bounds.east, bounds.north].join(","),
    q: query.trim(), limit: "50",
  });
  params.append("categories", "ATTRACTION");
  params.append("categories", "EXPERIENCE");
  if (cursor) params.set("cursor", cursor);
  return `/places?${params}`;
}
export function validMapBounds(bounds: MapBounds) {
  const { west, east, south, north } = bounds;
  return [west, east, south, north].every(Number.isFinite) && west < east && south < north &&
    west >= -180 && east <= 180 && south >= -90 && north <= 90 &&
    (east - west) * 111320 * Math.cos(south * Math.PI / 180) <= 49000 &&
    (north - south) * 111320 <= 49000;
}
export const exploreApi = {
  places: (bounds: MapBounds, query: string, signal?: AbortSignal, cursor?: string) =>
    apiGet<ListResponse<MapPlace>>(placesUrl(bounds, query, cursor), signal),
  posts: (region: string, signal?: AbortSignal) =>
    apiGet<ListResponse<Post>>(`/posts?limit=20${region ? `&region=${encodeURIComponent(region)}` : ""}`, signal),
  post: (id: string, signal?: AbortSignal) =>
    apiGet<ApiResponse<PostDetail>>(`/posts/${encodeURIComponent(id)}`, signal),
};
export type Post = {
  id: string; title: string; author: { nickname: string }; festivalId: string | null;
  festivalName: string; region: Region; excerpt: string; isSample: boolean; createdAt: string;
};
export type PostDetail = Post & { body: string; visitedOn: string };
