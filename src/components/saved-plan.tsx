"use client";
import { useCallback } from "react";
import { accountApi } from "@/lib/api/account";
import { useResource } from "@/lib/use-resource";
import { RequireAuth } from "./require-auth";
import { Loading, ErrorState, Notice } from "./ui";
import { planStatus } from "./private-library";
export function SavedPlan({ id }: { id: string }) {
  return (
    <RequireAuth>
      <PlanContent id={id} />
    </RequireAuth>
  );
}
function PlanContent({ id }: { id: string }) {
  const result = useResource(
    useCallback((signal: AbortSignal) => accountApi.plan(id, signal), [id]),
  );
  if (result.loading) return <Loading />;
  if (result.error)
    return <ErrorState message={result.error.message} retry={result.retry} />;
  const plan = result.data!.data;
  return (
    <>
      <p className="eyebrow mb-2">
        {planStatus[plan.status] ?? "상태 확인 필요"}
      </p>
      <h1 className="page-title">{plan.title}</h1>
      <Notice>
        현재 백엔드에서 저장된 일정을 표시합니다. AI 추천과 이동 경로 연결
        여부는 아래 안내를 확인해 주세요.
      </Notice>
      <div className="space-y-3 mt-4">
        {[...plan.warnings, ...plan.conflicts].map((item, i) => (
          <Notice key={`${item.code}-${i}`}>{item.message}</Notice>
        ))}
      </div>
      {plan.days.map((day, i) => (
        <section key={day.date} className="section">
          <h2>
            {i + 1}일차 · {day.date}
          </h2>
          <div className="space-y-3 mt-3">
            {day.stops.length === 0 ? (
              <p className="muted">등록된 일정이 없어요.</p>
            ) : (
              day.stops.map((stop) => (
                <article key={stop.id} className="info-card">
                  <h3>{stop.name}</h3>
                  <p className="muted mt-2">
                    {stop.startAt
                      ? new Date(stop.startAt).toLocaleTimeString("ko-KR", {
                          timeZone: "Asia/Seoul",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "시간 미정"}
                  </p>
                  <p className="muted">
                    {stop.costKrw === null
                      ? "비용 확인 필요"
                      : `${stop.costKrw.toLocaleString("ko-KR")}원`}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      ))}
      <section className="section info-card">
        <h2>확인된 총비용</h2>
        <p>{plan.budget.knownTotalKrw.toLocaleString("ko-KR")}원</p>
        <p className="muted mt-2">
          미확인 비용 {plan.budget.unknownItemCount}건 · 추가 비용이 발생할 수
          있어요.
        </p>
      </section>
    </>
  );
}
