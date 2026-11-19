export const regions = {
  CHEONAN: "천안",
  GONGJU: "공주",
  BORYEONG: "보령",
  ASAN: "아산",
  SEOSAN: "서산",
  NONSAN: "논산",
  GYERYONG: "계룡",
  DANGJIN: "당진",
  GEUMSAN: "금산",
  BUYEO: "부여",
  SEOCHEON: "서천",
  CHEONGYANG: "청양",
  HONGSEONG: "홍성",
  YESAN: "예산",
  TAEAN: "태안",
} as const;
export type Region = keyof typeof regions;
export type Interest =
  "FOOD" | "CAFE" | "NATURE" | "EXPERIENCE" | "CULTURE" | "SHOPPING";
export const categories = [
  { label: "전체", value: "" },
  { label: "자연", value: "NATURE" },
  { label: "문화", value: "CULTURE" },
  { label: "먹거리", value: "FOOD" },
] as const;
export type FestivalSummary = {
  id: string;
  name: string;
  region: Region;
  startDate: string;
  endDate: string;
  thumbnailUrl: string | null;
  tags: Interest[];
  status: "SCHEDULED" | "ONGOING" | "ENDED" | "CANCELLED" | "UNKNOWN";
};
export type RecommendedFestival = FestivalSummary & {
  recommendationReason: string;
  recommendationType: "SEASONAL" | "INTEREST" | "EDITORIAL";
};
export type Source = {
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
};
// 명세에 세부 객체 구조가 없는 부스·라인업은 표시용 최소 필드로 정의.
export type FestivalDetail = FestivalSummary &
  Source & {
    description: string;
    highlights?: { title: string; description: string; sourceUrl: string }[];
    programNotice?: string;
    sources?: { title: string; url: string }[];
    contact?: { phone: string; label: string };
    venue: { label: string; lat: number | null; lng: number | null } | null;
    openingHours: string | null;
    admission: { amountKrw: number | null; basis: string | null; description?: string; sourceUrl?: string; lastVerifiedAt?: string } | null;
    booths: ({ id: string; name: string } & Source)[];
    lineup: ({ id: string; name: string } & Source)[];
    shuttle: ({ description: string; url: string | null } & Source) | null;
    directions: ({ description: string; url: string | null } & Source) | null;
    dateSelection: { min: string; max: string };
  };
export type Program = Source & {
  id: string;
  festivalId: string;
  name: string;
  startAt: string | null;
  endAt: string | null;
  reservationRequired: boolean | null;
  costKrw: number | null;
};
export type ApiResponse<T> = {
  data: T;
  meta: { requestId: string; generatedAt?: string };
};
export type ListResponse<T> = ApiResponse<T[]> & {
  page: { nextCursor: string | null; hasNext: boolean };
};
export type Filters = {
  q?: string;
  region?: string;
  from?: string;
  to?: string;
  interests?: Interest[];
  sort?: "START_DATE_ASC" | "NAME_ASC";
  cursor?: string;
  limit?: number;
};
export type RecommendationFilters = Pick<
  Filters,
  "from" | "to" | "region" | "interests" | "limit"
>;
export interface FestivalRepository {
  list(
    filters?: Filters,
    signal?: AbortSignal,
  ): Promise<ListResponse<FestivalSummary>>;
  recommendations(
    filters?: RecommendationFilters,
    signal?: AbortSignal,
  ): Promise<ApiResponse<RecommendedFestival[]>>;
  detail(
    id: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<FestivalDetail>>;
  programs(id: string, signal?: AbortSignal): Promise<ApiResponse<Program[]>>;
}
