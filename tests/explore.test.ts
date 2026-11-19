import test from "node:test";
import assert from "node:assert/strict";
import { placesUrl, validMapBounds } from "../src/lib/explore";
import { getHeader } from "../src/lib/navigation";
test("지도는 관광·체험만 조회하고 범위와 검색어·커서를 유지한다", () => {
  const bounds = { west: 126.2, south: 36.6, east: 126.4, north: 36.9 };
  const url = new URL(placesUrl(bounds, " 해변 & 박물관 ", "a+b="), "https://test.local");
  assert.deepEqual(url.searchParams.getAll("categories"), ["ATTRACTION", "EXPERIENCE"]);
  assert.equal(url.searchParams.get("q"), "해변 & 박물관");
  assert.equal(url.searchParams.get("cursor"), "a+b=");
  assert.equal(validMapBounds(bounds), true);
  assert.equal(validMapBounds({ ...bounds, east: 130 }), false);
  assert.equal(validMapBounds({ ...bounds, west: NaN }), false);
  assert.equal(validMapBounds({ ...bounds, east: 126 }), false);
});
test("후기 상세에서는 게시판으로 돌아간다", () => {
  assert.equal(getHeader("/board/post_sample_01").backHref, "/board");
  assert.equal(getHeader("/board").backHref, null);
});
