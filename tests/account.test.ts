import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getHeader,
  rootTabs,
  safeReturnTo,
  loginPageUrl,
} from "../src/lib/navigation";
import {
  accountApi,
  nicknameError,
  providerLoginUrl,
  type UserSettings,
} from "../src/lib/api/account";
import { ApiError } from "../src/lib/api/client";
test("하단 메뉴 첫 화면에는 뒤로가기가 없고 마이페이지에만 설정을 둔다", () => {
  for (const path of rootTabs) {
    assert.equal(getHeader(path).backHref, null);
    assert.equal(getHeader(path).showSettings, path === "/my");
  }
  assert.equal(getHeader("/my/settings").backHref, "/my");
  assert.equal(getHeader("/my/settings/travel").backHref, "/my/settings");
  assert.equal(getHeader("/my/plans/abc").backHref, "/my/plans");
});
test("로그인 복귀 주소는 내부 경로만 허용한다", () => {
  for (const path of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%2f%2fevil.test",
    "/%255cevil.test",
    "/login?returnTo=/login",
  ])
    assert.equal(safeReturnTo(path), "/my");
  assert.equal(loginPageUrl("/my/reviews"), "/login?returnTo=%2Fmy%2Freviews");
  assert.match(
    providerLoginUrl("/my/plans", "dev"),
    /auth\/login\/dev\?returnTo=%2Fmy%2Fplans$/,
  );
});
test("닉네임 앞뒤 공백과 2~20자 제한을 검증한다", () => {
  assert.ok(nicknameError(" 가 "));
  assert.ok(nicknameError("가".repeat(21)));
  assert.equal(nicknameError(" 여행자 "), null);
});
test("설정 저장은 CSRF·버전을 보내고 출발지를 임의로 덮어쓰지 않는다", async () => {
  const original = globalThis.fetch;
  const value: UserSettings = {
    version: 3,
    travelDefaults: {
      origin: null,
      transport: "CAR",
      travelers: 2,
      interests: ["NATURE"],
      style: "RELAXED",
      lodgingPreference: "ANY",
    },
    privacy: { saveOrigin: false },
    updatedAt: null,
  };
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /\/me\/settings$/);
    assert.equal(init?.method, "PATCH");
    assert.equal(
      (init?.headers as Record<string, string>)["X-CSRF-Token"],
      "csrf-test",
    );
    const body = JSON.parse(String(init?.body));
    assert.equal(body.version, 3);
    assert.equal("originLocationId" in body.travelDefaults, false);
    assert.equal(body.privacy.saveOrigin, false);
    return Response.json({
      data: { ...value, version: 4 },
      meta: { requestId: "test" },
    });
  };
  try {
    assert.equal(
      (await accountApi.saveSettings(value, "csrf-test")).data.version,
      4,
    );
    await assert.rejects(
      accountApi.saveSettings(value, null),
      (e: unknown) => e instanceof ApiError && e.status === 401,
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("로그아웃 실패와 설정 충돌을 성공으로 처리하지 않는다", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      Response.json(
        {
          error: { code: "CONFLICT", message: "다른 탭에서 변경" },
          meta: { requestId: "conflict" },
        },
        { status: 409 },
      );
    await assert.rejects(
      accountApi.logout("csrf-test"),
      (e: unknown) => e instanceof ApiError && e.status === 409,
    );
    globalThis.fetch = async () => new Response(null, { status: 204 });
    assert.equal(await accountApi.logout("csrf-test"), undefined);
  } finally {
    globalThis.fetch = original;
  }
});
