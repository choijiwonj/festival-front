import { test } from "node:test";
import assert from "node:assert/strict";
import { createMockRepository } from "../src/lib/mock/repository";
import { festivals } from "../src/lib/mock/data";
import { filterFestivals, validateFilters } from "../src/lib/validation";
import { toQuery } from "../src/lib/api/festivals";
import { apiGet, ApiError } from "../src/lib/api/client";
test("추천 밖 축제도 이름·지역 검색으로 조회한다", () => {
  assert.deepEqual(
    filterFestivals(festivals, { q: "예산" }, "2026-11-15").map((f) => f.id),
    ["fst_demo_03"],
  );
});
test("관심사끼리 OR, 다른 조건과 AND; 기간은 양 끝 포함", () => {
  assert.deepEqual(
    filterFestivals(
      festivals,
      { interests: ["NATURE", "FOOD"], from: "2027-05-16", to: "2027-05-21" },
      "2026-11-15",
    ).map((f) => f.id),
    ["fst_demo_01", "fst_demo_03"],
  );
  assert.equal(
    filterFestivals(
      festivals,
      { q: "공주", interests: ["NATURE"] },
      "2026-11-15",
    ).length,
    0,
  );
});
test("날짜 미입력은 종료일이 오늘 이후인 축제만, 한쪽 날짜는 개방 구간", () => {
  assert.equal(filterFestivals(festivals, {}, "2027-05-17").length, 3);
  assert.equal(
    filterFestivals(festivals, { to: "2027-05-14" }, "2028-01-01").length,
    1,
  );
});
test("검색 길이·역전 날짜·존재하지 않는 날짜·잘못된 지역 검증", () => {
  assert.ok(validateFilters({ q: "가".repeat(101) }));
  assert.ok(validateFilters({ from: "2027-05-20", to: "2027-05-10" }));
  assert.ok(validateFilters({ from: "2027-02-30" }));
  assert.ok(validateFilters({ region: "SEOUL" }));
  assert.equal(validateFilters({ from: "2027-05-14", to: "2027-05-14" }), null);
});
test("API 배열은 같은 키 반복, camelCase 필드는 명세 유지", () => {
  const q = new URLSearchParams(
    toQuery({
      interests: ["NATURE", "CULTURE"],
      from: "2027-05-01",
      region: "TAEAN",
    }),
  );
  assert.deepEqual(q.getAll("interests"), ["NATURE", "CULTURE"]);
  assert.equal(q.get("from"), "2027-05-01");
  assert.equal(q.has("start_date"), false);
});
test("목 응답은 data/page/meta와 불투명 커서를 사용한다", async () => {
  const repo = createMockRepository();
  const first = await repo.list({ limit: 2 });
  assert.equal(first.data.length, 2);
  assert.equal(first.page.hasNext, true);
  assert.ok(first.meta.requestId);
  const next = await repo.list({ limit: 2, cursor: first.page.nextCursor! });
  assert.equal(next.data.length, 2);
  assert.equal(next.page.hasNext, false);
  assert.notEqual(first.data[0].id, next.data[0].id);
});
test("목 빈 상태·오류·없는 상세·취소 요청을 구분한다", async () => {
  assert.deepEqual((await createMockRepository("empty").list()).data, []);
  await assert.rejects(
    createMockRepository("error").list(),
    (e: unknown) => e instanceof ApiError && e.status === 503,
  );
  await assert.rejects(
    createMockRepository().detail("missing"),
    (e: unknown) => e instanceof ApiError && e.status === 404,
  );
  const controller = new AbortController();
  const promise = createMockRepository().list({}, controller.signal);
  controller.abort();
  await assert.rejects(promise, { name: "AbortError" });
});
test("무료 0원과 미확인 null을 보존한다", async () => {
  const repo = createMockRepository();
  assert.equal(
    (await repo.detail("fst_demo_01")).data.admission.amountKrw,
    null,
  );
  assert.equal((await repo.detail("fst_demo_04")).data.admission.amountKrw, 0);
});
test("실제 API 클라이언트가 오류 코드·필드·requestId를 보존한다", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        error: {
          code: "INVALID_DATE",
          message: "날짜 확인",
          fields: [{ path: "from", reason: "invalid" }],
          retryable: false,
        },
        meta: { requestId: "req_test" },
      }),
      { status: 422 },
    );
  try {
    await assert.rejects(
      apiGet("/festivals"),
      (e: unknown) =>
        e instanceof ApiError &&
        e.code === "INVALID_DATE" &&
        e.fields[0].path === "from" &&
        e.requestId === "req_test",
    );
  } finally {
    globalThis.fetch = original;
  }
});
