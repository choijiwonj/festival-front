import type { ApiResponse, ListResponse, Interest } from "../types";
import { apiGet, apiRequest } from "./client";
import { safeReturnTo } from "../navigation";

export type User = { id: string; nickname: string; avatarUrl: string | null };
export type Session = { user: User | null; csrfToken: string | null };
export type PlanSummary = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  primaryFestivalName?: string | null;
  createdAt: string;
};
export type PostSummary = {
  id: string;
  excerpt: string;
  createdAt: string;
  festivalId: string;
  coverUrl: string | null;
};
export type UserSettings = {
  version: number;
  travelDefaults: {
    origin: {
      locationId: string;
      label: string;
      lat: number;
      lng: number;
    } | null;
    transport: "CAR" | "PUBLIC_TRANSIT" | null;
    travelers: number | null;
    interests: Interest[];
    style: "RELAXED" | "PACKED" | null;
    lodgingPreference:
      "HOTEL" | "PENSION" | "GUESTHOUSE" | "ANY" | "SELF_ARRANGED" | null;
  };
  privacy: { saveOrigin: boolean };
  updatedAt: string | null;
};
export type PlanDetail = {
  id: string;
  title: string;
  status: string;
  days: {
    date: string;
    stops: {
      id: string;
      name: string;
      startAt: string | null;
      endAt: string | null;
      costKrw: number | null;
    }[];
  }[];
  warnings: { code: string; message: string }[];
  conflicts: { code: string; message: string }[];
  budget: {
    limitKrw: number | null;
    knownTotalKrw: number;
    unknownItemCount: number;
    status: string;
  };
};

export function providerLoginUrl(
  returnTo: string,
  provider = process.env.NEXT_PUBLIC_LOGIN_PROVIDER || "kakao",
) {
  const allowed = provider === "dev" ? "dev" : "kakao";
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
  return `${base.replace(/\/$/, "")}/auth/login/${allowed}?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
}
export const accountApi = {
  session: (signal?: AbortSignal) =>
    apiGet<ApiResponse<Session>>("/auth/session", signal),
  profile: (signal?: AbortSignal) => apiGet<ApiResponse<User>>("/me", signal),
  updateNickname: (nickname: string, csrfToken: string | null) =>
    apiRequest<ApiResponse<User>>("/me", {
      method: "PATCH",
      json: { nickname },
      csrfToken,
    }),
  logout: (csrfToken: string | null) =>
    apiRequest<void>("/auth/logout", { method: "POST", csrfToken }),
  plans: (cursor?: string, signal?: AbortSignal) =>
    apiGet<ListResponse<PlanSummary>>(
      `/me/trip-plans?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
      signal,
    ),
  plan: (id: string, signal?: AbortSignal) =>
    apiGet<ApiResponse<PlanDetail>>(
      `/trip-plans/${encodeURIComponent(id)}`,
      signal,
    ),
  reviews: (cursor?: string, signal?: AbortSignal) =>
    apiGet<ListResponse<PostSummary>>(
      `/me/posts?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
      signal,
    ),
  settings: (signal?: AbortSignal) =>
    apiGet<ApiResponse<UserSettings>>("/me/settings", signal),
  saveSettings: (value: UserSettings, csrfToken: string | null) =>
    apiRequest<ApiResponse<UserSettings>>("/me/settings", {
      method: "PATCH",
      csrfToken,
      json: {
        version: value.version,
        travelDefaults: {
          transport: value.travelDefaults.transport,
          travelers: value.travelDefaults.travelers,
          interests: value.travelDefaults.interests,
          style: value.travelDefaults.style,
          lodgingPreference: value.travelDefaults.lodgingPreference,
        },
        privacy: value.privacy,
      },
    }),
};
export function nicknameError(value: string) {
  const length = value.trim().length;
  return length < 2 || length > 20 ? "닉네임은 2~20자로 입력해 주세요." : null;
}
