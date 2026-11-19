import test from "node:test";
import assert from "node:assert/strict";
import { exportApi, exportDates, exportFile, exportOutcome, safeExportFilename, type ExportRecord } from "../src/lib/api/exports";
import { ApiError } from "../src/lib/api/client";

test("날짜는 계획 순서로 정렬하고 빈 선택·중복·계획 밖 날짜를 거절한다", () => {
  const dates = ["2026-12-24", "2026-12-25"];
  assert.deepEqual(exportDates(dates, [...dates].reverse()), dates);
  assert.throws(() => exportDates(dates, []));
  assert.throws(() => exportDates(dates, [dates[0], dates[0]]));
  assert.throws(() => exportDates(dates, ["2026-12-26"]));
});

test("내보내기 요청은 CSRF·중복 방지 키·계획 버전·선택 날짜를 전달한다", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.match(String(url), /\/trip-plans\/plan%2Fid\/exports$/);
    assert.equal(options?.method, "POST");
    assert.equal((options?.headers as Record<string, string>)["X-CSRF-Token"], "csrf");
    assert.equal((options?.headers as Record<string, string>)["Idempotency-Key"], "same-key");
    assert.deepEqual(JSON.parse(String(options?.body)), { version: 3, format: "PNG", dates: ["2026-12-24"] });
    return Response.json({ data: { exportId: "exp_1", jobId: "job_1" }, meta: {} }, { status: 202 });
  };
  try {
    assert.equal((await exportApi.create("plan/id", 3, "PNG", ["2026-12-24"], "csrf", "same-key")).data.exportId, "exp_1");
    await assert.rejects(exportApi.create("plan/id", 3, "PNG", ["2026-12-24"], null, "same-key"), (error) => error instanceof ApiError && error.status === 401);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test("작업 성공이라도 다운로드 메타데이터가 없으면 준비 완료로 처리하지 않는다", () => {
  const record = { status: "SUCCEEDED", filename: "여행.zip", contentType: "application/zip", downloadUrl: "/api/v1/exports/exp_1/download" } as ExportRecord;
  assert.equal(exportOutcome(record), "ready");
  assert.equal(exportOutcome({ ...record, downloadUrl: null }), "invalid");
  assert.equal(exportOutcome({ ...record, status: "FAILED" }), "failed");
  assert.equal(exportOutcome({ ...record, status: "RUNNING" }), "pending");
});

test("다운로드는 서버가 준 외부 URL 대신 인증된 자체 파일 경로를 사용한다", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /\/exports\/exp%2Fid\/download$/);
    assert.equal(options?.credentials, "same-origin");
    return new Response("%PDF-1.7", { headers: { "content-type": "application/pdf" } });
  };
  try { assert.ok((await exportFile("exp/id", "application/pdf")).size > 0); }
  finally { globalThis.fetch = original; }
});

test("실패 응답·빈 파일·JSON 오류를 다운로드 성공으로 처리하지 않는다", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ error: { code: "EXPORT_NOT_READY", message: "생성 중" } }, { status: 409 });
    await assert.rejects(exportFile("exp", "image/png"), (error) => error instanceof ApiError && error.code === "EXPORT_NOT_READY");
    globalThis.fetch = async () => new Response("", { headers: { "content-type": "image/png" } });
    await assert.rejects(exportFile("exp", "image/png"), (error) => error instanceof ApiError && error.code === "EXPORT_FILE_EMPTY");
    globalThis.fetch = async () => Response.json({ error: "unexpected" });
    await assert.rejects(exportFile("exp", "image/png"), (error) => error instanceof ApiError && error.code === "EXPORT_FILE_INVALID");
    globalThis.fetch = async () => new Response("zip", { headers: { "content-type": "application/zip" } });
    assert.ok((await exportFile("exp", "application/zip")).size);
  } finally { globalThis.fetch = original; }
});

test("저장 파일명은 경로·제어문자를 제거하고 실제 파일 형식과 일치시킨다", () => {
  assert.equal(safeExportFilename("여행 계획.pdf", "application/pdf"), "여행 계획.pdf");
  assert.equal(safeExportFilename("../여행\n.png", "application/zip"), "_여행_.zip");
  assert.equal(safeExportFilename(null, "image/png"), "여행계획.png");
});
