"use client";
import Link from "next/link";
import { useCallback } from "react";
import { tripApi } from "@/lib/api/trips";
import { stageLabels } from "@/lib/trips";
import { useResource } from "@/lib/use-resource";
export function ActiveRequests() {
  const result = useResource(
    useCallback((signal: AbortSignal) => tripApi.active(signal), []),
  );
  return (
    <section className="section">
      <h2>진행 중인 여행 요청</h2>
      {result.loading ? (
        <p className="muted mt-3" role="status">
          진행 중인 요청을 확인하고 있어요.
        </p>
      ) : result.error ? (
        <div className="info-card mt-3">
          <p className="muted">진행 중인 요청을 확인하지 못했어요.</p>
          <button className="text-link" onClick={result.retry}>
            다시 확인
          </button>
        </div>
      ) : result.data?.data.length === 0 ? (
        <p className="muted mt-3">현재 진행 중인 요청이 없어요.</p>
      ) : (
        <div className="space-y-3 mt-3">
          {result.data?.data.map((item) => (
            <Link
              className="festival-row"
              href={`/jobs/${encodeURIComponent(item.jobId)}`}
              key={item.id}
            >
              <div>
                <h3>{item.primaryFestival.name ?? "여행 계획"}</h3>
                <p>
                  {stageLabels[item.stage] ?? "여행 계획 처리 중"} ·{" "}
                  {item.startDate}
                </p>
              </div>
              <span aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
