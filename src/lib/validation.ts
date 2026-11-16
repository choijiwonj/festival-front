import { regions, type Filters } from "./types";
export function validateFilters(f: Filters): string | null {
  if ((f.q?.trim().length ?? 0) > 100)
    return "검색어는 100자 이내로 입력해 주세요.";
  for (const value of [f.from, f.to])
    if (
      value &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(value)) ||
        new Date(value).toISOString().slice(0, 10) !== value)
    )
      return "올바른 날짜를 입력해 주세요.";
  if (f.from && f.to && f.from > f.to)
    return "종료일은 시작일 이후로 선택해 주세요.";
  if (f.region && !(f.region in regions)) return "충남 지역을 선택해 주세요.";
  if (
    f.interests?.some(
      (i) =>
        ![
          "FOOD",
          "CAFE",
          "NATURE",
          "EXPERIENCE",
          "CULTURE",
          "SHOPPING",
        ].includes(i),
    )
  )
    return "올바른 관심사를 선택해 주세요.";
  if (f.sort && !["START_DATE_ASC", "NAME_ASC"].includes(f.sort))
    return "정렬 조건을 확인해 주세요.";
  if (
    f.limit !== undefined &&
    (!Number.isInteger(f.limit) || f.limit < 1 || f.limit > 50)
  )
    return "조회 개수는 1~50개여야 합니다.";
  return null;
}
