"use client";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
  accountApi,
  type PlanSummary,
  type PostSummary,
} from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";
import { useResource } from "@/lib/use-resource";
import type { ListResponse } from "@/lib/types";
import { RequireAuth, LoginPrompt } from "./require-auth";
import { Loading, ErrorState, Notice, formatDates } from "./ui";

export const planStatus: Record<string, string> = {
  READY: "여행 준비 완료",
  NEEDS_REVIEW: "확인이 필요해요",
  INFEASIBLE: "조건 조정이 필요해요",
};
export function PrivateLibrary({ kind }: { kind: "plans" | "reviews" }) {
  return (
    <RequireAuth>
      <Library key={kind} kind={kind} />
    </RequireAuth>
  );
}
function Library({ kind }: { kind: "plans" | "reviews" }) {
  const [cursor, setCursor] = useState<string | undefined>();
  const result = useResource<ListResponse<PlanSummary | PostSummary>>(
    useCallback(
      (signal: AbortSignal) =>
        kind === "plans"
          ? accountApi.plans(cursor, signal)
          : accountApi.reviews(cursor, signal),
      [kind, cursor],
    ),
  );
  if (result.loading) return <Loading />;
  if (result.error instanceof ApiError && result.error.status === 401)
    return <LoginPrompt returnTo={`/my/${kind}`} />;
  if (result.error instanceof ApiError && result.error.status === 404)
    return (
      <>
        <h1 className="page-title">
          {kind === "plans" ? "저장된 계획" : "내 후기"}
        </h1>
        <Notice>
          아직 이 기능을 준비하고 있어요. 준비되면 나의 기록을 확인할 수
          있습니다.
        </Notice>
      </>
    );
  if (result.error)
    return <ErrorState message={result.error.message} retry={result.retry} />;
  const data = result.data!.data;
  return (
    <>
      <h1 className="page-title">
        {kind === "plans" ? "다시 꺼내 보는 여행" : "내가 남긴 여행 이야기"}
      </h1>
      {data.length === 0 ? (
        <div className="state-card">
          <h2>
            {kind === "plans"
              ? "아직 저장된 계획이 없어요"
              : "아직 작성한 후기가 없어요"}
          </h2>
          <p>축제에서 새로운 여행을 시작해 보세요.</p>
          <Link className="text-link" href="/festivals">
            축제 둘러보기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item) =>
            kind === "plans" ? (
              <Link
                className="festival-row"
                key={item.id}
                href={`/my/plans/${encodeURIComponent(item.id)}`}
              >
                <div>
                  <span className="eyebrow">
                    {planStatus[(item as PlanSummary).status] ??
                      "상태 확인 필요"}
                  </span>
                  <h2 className="text-sm mt-1">
                    {(item as PlanSummary).title}
                  </h2>
                  <p>
                    {formatDates(
                      (item as PlanSummary).startDate,
                      (item as PlanSummary).endDate,
                    )}
                  </p>
                </div>
                <span aria-hidden="true">›</span>
              </Link>
            ) : (
              <article key={item.id} className="info-card">
                <p>{(item as PostSummary).excerpt}</p>
                <p className="muted mt-2">
                  {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  })}
                </p>
              </article>
            ),
          )}
        </div>
      )}
      {(cursor || result.data?.page.hasNext) && (
        <div className="pagination">
          <button disabled={!cursor} onClick={() => setCursor(undefined)}>
            처음으로
          </button>
          <button
            disabled={!result.data?.page.hasNext}
            onClick={() => setCursor(result.data?.page.nextCursor ?? undefined)}
          >
            다음 목록
          </button>
        </div>
      )}
    </>
  );
}
