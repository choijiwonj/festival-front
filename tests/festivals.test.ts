import { test } from "node:test";
import assert from "node:assert/strict";
import { validateFilters } from "../src/lib/validation";
import { toQuery, apiRepository } from "../src/lib/api/festivals";
import { festivalRepository } from "../src/lib/repository";
import { apiGet, ApiError } from "../src/lib/api/client";

test("검색 길이·역전 날짜·존재하지 않는 날짜·잘못된 지역 검증", () => {
  assert.ok(validateFilters({ q: "가".repeat(101) }));
  assert.ok(validateFilters({ from: "2027-05-20", to: "2027-05-10" }));
  assert.ok(validateFilters({ from: "2027-02-30" }));
  assert.ok(validateFilters({ region: "SEOUL" }));
  assert.equal(validateFilters({ from: "2027-05-14", to: "2027-05-14" }), null);
});
test("배열 쿼리와 커서를 API 명세대로 직렬화한다", () => {
  const query = new URLSearchParams(
    toQuery({
      interests: ["NATURE", "CULTURE"],
      from: "2027-05-01",
      region: "TAEAN",
      cursor: "opaque-cursor",
    }),
  );
  assert.deepEqual(query.getAll("interests"), ["NATURE", "CULTURE"]);
  assert.equal(query.get("from"), "2027-05-01");
  assert.equal(query.get("cursor"), "opaque-cursor");
  assert.equal(query.has("start_date"), false);
});
test("화면 저장소는 항상 실제 API 구현을 사용한다", () => {
  assert.equal(festivalRepository, apiRepository);
});
test("빈 API 목록을 대체 데이터 없이 반환하고 요청 옵션을 유지한다", async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /\/festivals\?/);
    assert.equal(init?.signal, controller.signal);
    assert.equal(init?.credentials, "same-origin");
    assert.equal(init?.cache, "no-store");
    return new Response(
      JSON.stringify({
        data: [],
        page: { nextCursor: null, hasNext: false },
        meta: { requestId: "req_test" },
      }),
    );
  };
  try {
    const result = await festivalRepository.list({}, controller.signal);
    assert.deepEqual(result.data, []);
    assert.equal(result.page.hasNext, false);
  } finally {
    globalThis.fetch = original;
  }
});
test("서버 오류의 코드·필드·requestId를 유지한다", async () => {
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
test("통신 실패를 API 오류로 표시하고 취소 요청은 그대로 전달한다", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      throw new TypeError("offline");
    };
    await assert.rejects(
      festivalRepository.list(),
      (e: unknown) => e instanceof ApiError && e.code === "NETWORK_ERROR",
    );
    globalThis.fetch = async () => {
      throw new DOMException("Aborted", "AbortError");
    };
    await assert.rejects(festivalRepository.list(), { name: "AbortError" });
  } finally {
    globalThis.fetch = original;
  }
});
