import { test } from "node:test";
import assert from "node:assert/strict";
import { accountApi } from "../src/lib/api/account";
import { ApiError } from "../src/lib/api/client";
test("비밀번호 로그인만 사전 CSRF 없이 요청하고 기존 쓰기 API는 제한한다", async () => {
  const original = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async (url, init) => {
    requests++;
    assert.match(String(url), /\/auth\/login$/);
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), {
      username: "festival",
      password: " test-password ",
    });
    assert.equal(init?.credentials, "same-origin");
    assert.equal(
      (init?.headers as Record<string, string>)["X-CSRF-Token"],
      undefined,
    );
    return Response.json({
      data: {
        user: { id: "u", nickname: "여행자", avatarUrl: null },
        csrfToken: "csrf",
      },
      meta: { requestId: "test" },
    });
  };
  try {
    assert.equal(
      (await accountApi.login(" Festival ", " test-password ")).data.csrfToken,
      "csrf",
    );
    await assert.rejects(
      accountApi.updateNickname("새닉네임", null),
      (e: unknown) => e instanceof ApiError && e.status === 401,
    );
    assert.equal(requests, 1);
  } finally {
    globalThis.fetch = original;
  }
});
test("로그인 실패는 서버 안내를 유지하고 성공으로 처리하지 않는다", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json(
      {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "아이디 또는 비밀번호를 확인해 주세요.",
          fields: [],
          retryable: false,
        },
        meta: { requestId: "test" },
      },
      { status: 401 },
    );
  try {
    await assert.rejects(
      accountApi.login("festival", "incorrect-password"),
      (e: unknown) => e instanceof ApiError && e.code === "INVALID_CREDENTIALS",
    );
  } finally {
    globalThis.fetch = original;
  }
});
