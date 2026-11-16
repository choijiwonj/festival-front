import type {
  FestivalDetail,
  FestivalSummary,
  RecommendedFestival,
  Program,
} from "../types";
const source = { sourceUrl: null, lastVerifiedAt: null };
const common = {
  ...source,
  openingHours: "10:00–20:00 (시연용 운영시간)",
  admission: { amountKrw: null, basis: null },
  booths: [
    {
      ...source,
      id: "booth_demo_01",
      name: "예시 로컬 먹거리 부스 · 지역 간식과 도시락",
    },
    {
      ...source,
      id: "booth_demo_02",
      name: "예시 공예 체험 부스 · 작은 여행 기념품 만들기",
    },
    {
      ...source,
      id: "booth_demo_03",
      name: "예시 종합 안내소 · 행사 안내와 휴식 공간",
    },
  ],
  lineup: [
    {
      ...source,
      id: "lineup_demo_01",
      name: "14:00 동네 어쿠스틱 공연 (가상)",
    },
    { ...source, id: "lineup_demo_02", name: "18:00 주말 작은 음악회 (가상)" },
  ],
  shuttle: {
    ...source,
    description:
      "[더미] 예시 터미널 ↔ 축제 입구, 30분 간격으로 운행하는 시연 데이터입니다. 실제 운행 정보가 아닙니다.",
    url: null,
  },
  directions: {
    ...source,
    description:
      "[더미] 예시 터미널에서 축제 안내소를 거쳐 입장하는 가상 동선입니다. 실제 주소·도로·이동시간은 연결되지 않았습니다.",
    url: null,
  },
  status: "SCHEDULED" as const,
  thumbnailUrl: null,
};
export const festivals: FestivalDetail[] = [
  {
    ...common,
    id: "fst_demo_01",
    name: "봄빛 정원축제",
    region: "TAEAN",
    tags: ["NATURE"],
    startDate: "2027-05-14",
    endDate: "2027-05-16",
    description:
      "정원의 봄을 즐기고, 작은 동네의 맛과 이야기를 만나는 축제입니다.",
    venue: { label: "예시 축제공원", lat: null, lng: null },
    dateSelection: { min: "2027-05-12", max: "2027-05-18" },
  },
  {
    ...common,
    id: "fst_demo_02",
    name: "달빛 골목축제",
    region: "GONGJU",
    tags: ["CULTURE"],
    startDate: "2027-05-15",
    endDate: "2027-05-17",
    description:
      "낮은 담장 옆 골목을 걸으며 동네의 이야기를 만나 보세요. 시연을 위한 가상 축제입니다.",
    venue: { label: "예시 골목 문화거리", lat: null, lng: null },
    dateSelection: { min: "2027-05-13", max: "2027-05-19" },
  },
  {
    ...common,
    id: "fst_demo_03",
    name: "로컬 미식축제",
    region: "YESAN",
    tags: ["FOOD"],
    startDate: "2027-05-21",
    endDate: "2027-05-23",
    description: "작은 장터에서 만나는 지역의 맛. 시연을 위한 가상 축제입니다.",
    venue: { label: "예시 로컬 장터", lat: null, lng: null },
    dateSelection: { min: "2027-05-19", max: "2027-05-25" },
  },
  {
    ...common,
    id: "fst_demo_04",
    name: "바다 체험축제",
    region: "BORYEONG",
    tags: ["NATURE", "EXPERIENCE"],
    startDate: "2027-05-28",
    endDate: "2027-05-30",
    description:
      "바닷바람을 따라 떠나는 느긋한 하루. 시연을 위한 가상 축제입니다.",
    venue: { label: "예시 바닷가 체험장", lat: null, lng: null },
    admission: { amountKrw: 0, basis: "시연용 무료 입장" },
    dateSelection: { min: "2027-05-26", max: "2027-06-01" },
  },
];
export function toSummary(f: FestivalSummary): FestivalSummary {
  const { id, name, region, startDate, endDate, thumbnailUrl, tags, status } =
    f;
  return { id, name, region, startDate, endDate, thumbnailUrl, tags, status };
}
export const recommendations: RecommendedFestival[] = festivals
  .slice(0, 2)
  .map((f, i) => ({
    ...toSummary(f),
    recommendationReason: i ? "낮은 담장 옆 골목 산책" : "꽃길 따라 천천히",
    recommendationType: "EDITORIAL",
  }));
export const programs: Record<string, Program[]> = {
  fst_demo_01: [
    {
      ...source,
      id: "pr_demo_01",
      festivalId: "fst_demo_01",
      name: "예시 개막 공연",
      startAt: "2027-05-14T18:00:00+09:00",
      endAt: "2027-05-14T19:00:00+09:00",
      reservationRequired: null,
      costKrw: null,
    },
  ],
};

// 모든 축제의 프로그램 탭을 확인할 수 있는 가상 공연/체험 데이터.
for (const festival of festivals) {
  programs[festival.id] ??= [];
  programs[festival.id].push(
    {
      ...source,
      id: `${festival.id}_experience`,
      festivalId: festival.id,
      name: "예시 동네 공예 체험",
      startAt: `${festival.startDate}T11:00:00+09:00`,
      endAt: `${festival.startDate}T12:00:00+09:00`,
      reservationRequired: true,
      costKrw: 5000,
    },
    {
      ...source,
      id: `${festival.id}_music`,
      festivalId: festival.id,
      name: "예시 작은 음악회",
      startAt: `${festival.startDate}T18:00:00+09:00`,
      endAt: `${festival.startDate}T19:00:00+09:00`,
      reservationRequired: false,
      costKrw: 0,
    },
  );
}
