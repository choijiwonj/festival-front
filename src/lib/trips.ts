import type { FestivalDetail, Interest, Program } from "./types";
export type Location = {
  locationId: string;
  label: string;
  lat: number;
  lng: number;
};
export type TripInput = {
  primaryFestivalId: string;
  additionalFestivalIds: string[];
  startDate: string;
  endDate: string;
  origin: Location;
  transport: "CAR" | "PUBLIC_TRANSIT";
  travelers: number;
  budgetKrw: number | null;
  interests: Interest[];
  style: "RELAXED" | "PACKED";
  lodgingPreference:
    "HOTEL" | "PENSION" | "GUESTHOUSE" | "ANY" | "SELF_ARRANGED" | null;
  requiredPlaceIds: string[];
  requiredProgramIds: string[];
  additionalRequests: string | null;
};
export type TripForm = Omit<TripInput, "origin" | "budgetKrw"> & {
  origin: Location | null;
  budgetKrw: string;
};
export type Warning = { code: string; message: string };
export type ValidationResult = {
  valid: boolean;
  normalizedInput: TripInput;
  days: number;
  nights: number;
  warnings: Warning[];
};
export type Job = {
  id: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  stage: string;
  result: { planId?: string } | null;
  error: { code: string; message: string; retryable?: boolean } | null;
  festivalId?: string | null;
};
export type RequestSummary = {
  id: string;
  jobId: string;
  primaryFestival: { id: string; name: string | null };
  startDate: string;
  endDate: string;
  jobStatus: string;
  stage: string;
  error: Warning | null;
};
export type Stop = {
  id: string;
  type: string;
  placeId: string | null;
  name: string;
  startAt: string | null;
  endAt: string | null;
  costKrw: number | null;
  costStatus: string;
  scheduleAssumptions?: string[];
  estimatedDurationMinutes?: number;
  planningBasis?: string;
  recommendationReason?: string | null;
  sourceUrl?: string | null;
};
export type Leg = {
  fromStopId: string;
  toStopId: string;
  mode: string;
  durationMinutes: number | null;
  distanceMeters: number | null;
  departureAt?: string | null;
  arrivalAt?: string | null;
  serviceTimeStatus?: string;
  segments?: {
    mode: string;
    fromName?: string;
    toName?: string;
    durationMinutes?: number;
    lines?: { busNo?: string; name?: string }[];
    walkabilityStatus?: string;
  }[];
};
export type TripPlan = {
  id: string;
  version: number;
  title: string;
  status: string;
  inputSnapshot: TripInput;
  parentPlanId: string | null;
  days: { date: string; stops: Stop[]; legs: Leg[] }[];
  warnings: Warning[];
  conflicts: Warning[];
  budget: {
    limitKrw: number | null;
    knownTotalKrw: number;
    estimatedTotalKrw?: number | null;
    items?: { label: string; amountKrw: number | null; status: string }[];
    unknownItemCount: number;
    status: string;
  };
};
export type Place = {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  distanceM: number | null;
};
export const interestLabels: Record<Interest, string> = {
  FOOD: "먹거리",
  CAFE: "카페",
  NATURE: "자연",
  EXPERIENCE: "체험",
  CULTURE: "문화",
  SHOPPING: "쇼핑",
};
export const lodgingLabels = {
  ANY: "상관없음",
  HOTEL: "호텔",
  PENSION: "펜션",
  GUESTHOUSE: "게스트하우스",
  SELF_ARRANGED: "직접 준비",
};
export const stageLabels: Record<string, string> = {
  VALIDATING: "여행 조건 확인 중",
  RECOMMENDING: "주변 장소 검토 중",
  RETRIEVING: "주변 장소 확인 중",
  SCHEDULING: "일정 배치 중",
  ROUTING: "이동 경로 확인 중",
  FINALIZING: "결과 정리 중",
  COMPLETED: "생성 완료",
  DONE: "생성 완료",
};
export function initialTrip(festival: FestivalDetail): TripForm {
  return {
    primaryFestivalId: festival.id,
    additionalFestivalIds: [],
    startDate: festival.startDate,
    endDate: festival.startDate,
    origin: null,
    transport: "CAR",
    travelers: 1,
    budgetKrw: "",
    interests: [],
    style: "RELAXED",
    lodgingPreference: "ANY",
    requiredPlaceIds: [],
    requiredProgramIds: [],
    additionalRequests: "",
  };
}
function calendarDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const t = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === value
    ? t
    : null;
}
export function tripDateError(
  form: Pick<TripForm, "startDate" | "endDate">,
  festival: FestivalDetail,
): string | null {
  const start = calendarDay(form.startDate),
    end = calendarDay(form.endDate);
  if (start === null || end === null)
    return "시작일과 종료일을 올바르게 입력해 주세요.";
  if (start > end) return "종료일은 시작일과 같거나 늦어야 해요.";
  if (
    form.startDate < festival.dateSelection.min ||
    form.endDate > festival.dateSelection.max
  )
    return "축제 기간 전후 2일 안에서 선택해 주세요.";
  if (form.endDate < festival.startDate || form.startDate > festival.endDate)
    return "축제 개최일을 하루 이상 포함해 주세요.";
  if ((end - start) / 86400000 + 1 > 2)
    return "현재 여행은 당일 또는 1박 2일로 만들 수 있어요.";
  return null;
}
export function pickableProgram(
  program: Program,
  form: Pick<TripForm, "startDate" | "endDate">,
) {
  if (!program.startAt || !program.endAt) return false;
  const start = new Date(program.startAt),
    end = new Date(program.endAt);
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || end < start)
    return false;
  const day = new Date(+start + 9 * 3600000).toISOString().slice(0, 10);
  return day >= form.startDate && day <= form.endDate;
}
export function tripError(
  form: TripForm,
  festival: FestivalDetail,
): string | null {
  if (festival.status === "CANCELLED") return "취소된 축제는 선택할 수 없어요.";
  const dates = tripDateError(form, festival);
  if (dates) return dates;
  if (!form.origin?.locationId)
    return "출발지를 검색한 뒤 결과에서 선택해 주세요.";
  if (
    !Number.isInteger(form.travelers) ||
    form.travelers < 1 ||
    form.travelers > 20
  )
    return "인원은 1~20명으로 입력해 주세요.";
  if (
    form.budgetKrw !== "" &&
    (!/^\d+$/.test(form.budgetKrw) ||
      !Number.isSafeInteger(Number(form.budgetKrw)))
  )
    return "예산은 0 이상의 정수로 입력해 주세요.";
  if ((form.additionalRequests?.length ?? 0) > 1000)
    return "추가 요청은 1,000자까지 입력할 수 있어요.";
  if (form.requiredPlaceIds.length > 10 || form.requiredProgramIds.length > 10)
    return "필수 장소와 프로그램은 각각 최대 10개까지 선택할 수 있어요.";
  return null;
}
export function tripPayload(form: TripForm): TripInput {
  if (!form.origin) throw new Error("출발지를 선택해 주세요.");
  return {
    ...form,
    origin: form.origin,
    budgetKrw: form.budgetKrw === "" ? null : Number(form.budgetKrw),
    lodgingPreference:
      form.startDate === form.endDate ? null : form.lodgingPreference,
    additionalRequests: form.additionalRequests?.trim() || null,
  };
}
export function generationOutcome(
  job: Job,
): "running" | "failed" | "success" | "invalid" {
  return job.status === "FAILED"
    ? "failed"
    : job.status === "SUCCEEDED"
      ? job.result?.planId
        ? "success"
        : "invalid"
      : "running";
}
export function recommendationLabel(warnings: Warning[]) {
  return warnings.some(
    (w) => w.code === "NO_CANDIDATES" || w.code === "FESTIVAL_LOCATION_UNKNOWN",
  )
    ? "추천 장소 확인 필요"
    : warnings.some((w) => w.code === "AI_RECOMMENDATION_FALLBACK")
      ? "기본 추천으로 구성된 일정"
      : "생성된 여행 계획";
}
