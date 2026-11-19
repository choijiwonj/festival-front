import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialTrip,
  tripDateError,
  tripError,
  tripPayload,
  pickableProgram,
  generationOutcome,
  recommendationLabel,
  type Job,
} from "../src/lib/trips";
import type { FestivalDetail, Program } from "../src/lib/types";
import { tripApi } from "../src/lib/api/trips";
import { ApiError } from "../src/lib/api/client";
// Contract fixtures stay in tests and are never imported by product screens.
const festival = {
  id: "f_test",
  startDate: "2026-11-19",
  endDate: "2026-11-21",
  status: "ONGOING",
  dateSelection: { min: "2026-11-17", max: "2026-11-23" },
} as FestivalDetail;
const origin = {
  locationId: "loc_signed_test",
  label: "테스트 출발지",
  lat: 36.4,
  lng: 127.1,
};
test("여행은 당일·1박 2일이고 축제 개최일을 포함해야 한다", () => {
  const f = initialTrip(festival);
  assert.equal(tripDateError(f, festival), null);
  assert.equal(tripDateError({ ...f, endDate: "2026-11-20" }, festival), null);
  for (const patch of [
    { startDate: "2026-02-30" },
    { endDate: "2026-11-18" },
    { endDate: "2026-11-21" },
    { startDate: "2026-11-17", endDate: "2026-11-18" },
    { startDate: "2026-11-16", endDate: "2026-11-19" },
  ])
    assert.ok(tripDateError({ ...f, ...patch }, festival));
});
test("검색 결과 출발지와 인원·예산·요청 길이를 검증한다", () => {
  const f = { ...initialTrip(festival), origin };
  assert.equal(tripError(f, festival), null);
  for (const patch of [
    { origin: null },
    { travelers: 0 },
    { travelers: 1.2 },
    { travelers: 21 },
    { budgetKrw: "-1" },
    { budgetKrw: "1.5" },
    { budgetKrw: "Infinity" },
    { additionalRequests: "가".repeat(1001) },
  ])
    assert.ok(tripError({ ...f, ...patch }, festival));
  assert.ok(tripError(f, { ...festival, status: "CANCELLED" }));
});
test("당일 숙박은 제거하고 예산 0원과 미입력을 구분한다", () => {
  const f = { ...initialTrip(festival), origin };
  assert.equal(tripPayload(f).budgetKrw, null);
  assert.equal(tripPayload({ ...f, budgetKrw: "0" }).budgetKrw, 0);
  assert.equal(tripPayload(f).lodgingPreference, null);
  assert.equal(
    tripPayload({ ...f, endDate: "2026-11-20" }).lodgingPreference,
    "ANY",
  );
});
test("필수 프로그램은 한국시간 날짜와 확정 시각으로 선택한다", () => {
  const p = {
    id: "p",
    startAt: "2026-11-18T15:00:00Z",
    endAt: "2026-11-18T16:00:00Z",
  } as Program;
  assert.equal(pickableProgram(p, initialTrip(festival)), true);
  assert.equal(
    pickableProgram({ ...p, endAt: null }, initialTrip(festival)),
    false,
  );
  assert.equal(
    pickableProgram(
      { ...p, startAt: "2026-11-17T15:00:00Z" },
      initialTrip(festival),
    ),
    false,
  );
});
test("생성 API는 CSRF·동일한 중복 방지 키와 정규화된 조건을 전달한다", async () => {
  const original = globalThis.fetch;
  const body = tripPayload({ ...initialTrip(festival), origin });
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.match(String(url), /\/trip-requests$/);
    assert.equal(options?.method, "POST");
    assert.equal(
      (options?.headers as Record<string, string>)["X-CSRF-Token"],
      "csrf",
    );
    assert.equal(
      (options?.headers as Record<string, string>)["Idempotency-Key"],
      "stable-key",
    );
    assert.deepEqual(JSON.parse(String(options?.body)), body);
    return Response.json(
      {
        data: { jobId: "j1", requestId: "r1", statusUrl: "/api/v1/jobs/j1" },
        meta: { requestId: "test" },
      },
      { status: 202 },
    );
  };
  try {
    assert.equal(
      (await tripApi.create(body, "csrf", "stable-key")).data.jobId,
      "j1",
    );
    await tripApi.create(body, "csrf", "stable-key");
    assert.equal(calls, 2);
    await assert.rejects(
      tripApi.create(body, null, "stable-key"),
      (e: unknown) => e instanceof ApiError && e.status === 401,
    );
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = original;
  }
});
test("재추천은 원래 버전과 입력 스냅샷을 포함한다", async () => {
  const original = globalThis.fetch;
  const input = tripPayload({ ...initialTrip(festival), origin });
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /\/trip-plans\/plan%2Fid\/regenerations$/);
    assert.deepEqual(JSON.parse(String(options?.body)), {
      ...input,
      baseVersion: 3,
    });
    return Response.json(
      { data: { jobId: "j2" }, meta: { requestId: "test" } },
      { status: 202 },
    );
  };
  try {
    assert.equal(
      (await tripApi.regenerate("plan/id", 3, input, "csrf", "stable-key")).data
        .jobId,
      "j2",
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("완료 상태라도 결과 ID가 없으면 성공 화면으로 이동하지 않는다", () => {
  assert.equal(
    generationOutcome({ status: "SUCCEEDED", result: { planId: "p" } } as Job),
    "success",
  );
  assert.equal(
    generationOutcome({ status: "SUCCEEDED", result: null } as Job),
    "invalid",
  );
  assert.equal(generationOutcome({ status: "FAILED" } as Job), "failed");
  assert.equal(generationOutcome({ status: "RUNNING" } as Job), "running");
});
test("AI 미연결·대체 추천 안내를 AI 성공으로 표현하지 않는다", () => {
  assert.equal(
    recommendationLabel([{ code: "NO_CANDIDATES", message: "AI 미연결" }]),
    "추천 장소 확인 필요",
  );
  assert.equal(
    recommendationLabel([
      { code: "AI_RECOMMENDATION_FALLBACK", message: "대체" },
    ]),
    "기본 추천으로 구성된 일정",
  );
});
