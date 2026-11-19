"use client";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { accountApi } from "@/lib/api/account";
import { tripApi } from "@/lib/api/trips";
import { recommendationLabel, type TripPlan, type Leg } from "@/lib/trips";
import { useResource } from "@/lib/use-resource";
import { RequireAuth } from "./require-auth";
import { useAuth } from "./auth-provider";
import { Loading, ErrorState, Notice } from "./ui";
import { planStatus } from "./private-library";
import { PlanExport } from "./plan-export";
export function SavedPlan({ id }: { id: string }) {
  return (
    <RequireAuth>
      <PlanContent key={id} id={id} />
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
  return <PlanView plan={result.data!.data} />;
}
function PlanView({ plan }: { plan: TripPlan }) {
  const { session } = useAuth();
  const router = useRouter();
  const [dayIndex, setDayIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const key = useRef<string | null>(null),
    pending = useRef(false);
  async function regenerate() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    key.current ??= crypto.randomUUID();
    try {
      const response = await tripApi.regenerate(
        plan.id,
        plan.version,
        plan.inputSnapshot,
        session?.csrfToken ?? null,
        key.current,
      );
      router.push(`/jobs/${encodeURIComponent(response.data.jobId)}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "재추천하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const day = plan.days[dayIndex];
  const timedStops = day?.stops.filter((stop) => stop.startAt || stop.type !== "PLACE") ?? [];
  const untimedStops = day?.stops.filter((stop) => !stop.startAt && stop.type === "PLACE") ?? [];
  const displayStops = [...timedStops, ...untimedStops];
  const warnings = [...plan.warnings, ...plan.conflicts];
  const sourceIncomplete = warnings.some((w) =>
    [
      "NO_CANDIDATES",
      "AI_RECOMMENDATION_FALLBACK",
      "FESTIVAL_LOCATION_UNKNOWN",
    ].includes(w.code),
  );
  return (
    <>
      <p className="eyebrow mb-2">
        {planStatus[plan.status] ?? "상태 확인 필요"} · 저장된 계획
      </p>
      <h1 className="page-title">{plan.title}</h1>
      <Notice>
        <h2>{recommendationLabel(warnings)}</h2>
        <p>
          {sourceIncomplete
            ? "AI 장소 추천을 완료하지 못했거나 추가 후보가 없는 일정입니다. 아래 사유와 미확인 정보를 확인해 주세요."
            : "추천 이유와 날짜별 방문 일정을 확인해 주세요. 이동·영업시간·비용이 미확인인 항목은 방문 전 확인이 필요해요."}
        </p>
      </Notice>
      {warnings.length > 0 && (
        <details
          className="trip-warnings mt-4"
          open={sourceIncomplete || plan.status !== "READY"}
        >
          <summary>확인이 필요한 안내 {warnings.length}건</summary>
          <div className="space-y-3 mt-3">
            {warnings.map((w, i) => (
              <Notice key={`${w.code}-${i}`}>{w.message}</Notice>
            ))}
          </div>
        </details>
      )}
      <section className="section">
        <h2>여행 일정</h2>
        <div role="group" aria-label="날짜별 일정" className="chips mt-3">
          {plan.days.map((d, i) => (
            <button
              type="button"
              key={d.date}
              className="chip"
              aria-pressed={i === dayIndex}
              onClick={() => setDayIndex(i)}
            >
              {i + 1}일차 · {d.date.slice(5).replace("-", ".")}
            </button>
          ))}
        </div>
        {day && (
          <div className="trip-day mt-4" aria-live="polite">
            <h3>{day.date}</h3>
            <p className="muted mt-2">시간은 이동 예상치와 방문 가정을 반영한 일정입니다. 영업 여부와 비용은 출발 전 확인해 주세요.</p>
            {(day.legs ?? []).filter((leg) => leg.fromStopId === "ORIGIN").map((leg, index) => (
              <div key={`origin-${index}`} className="mt-3">
                <p className="eyebrow">출발지 · {plan.inputSnapshot.origin?.label}</p>
                <LegView leg={leg} />
              </div>
            ))}
            {day.stops.length === 0 ? (
              <div className="state-card mt-3">
                <p>등록된 방문 일정이 없어요. 위의 안내를 확인해 주세요.</p>
              </div>
            ) : (
              displayStops.map((stop, i) => (
                <div key={stop.id}>
                  {!stop.startAt && stop.type === "PLACE" && i === timedStops.length && (
                    <div className="info-card mt-4 mb-3">
                      <h3>방문 시간 미배정</h3>
                      <p className="muted">아래 장소는 시간이나 경로를 확인하지 못해 여행 루트에 포함하지 못했습니다.</p>
                    </div>
                  )}
                  <article className="trip-stop">
                    <span className="trip-stop-number" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div>
                      <p className="eyebrow">
                        {time(stop.startAt)}
                        {stop.endAt ? ` ~ ${time(stop.endAt)}` : ""}
                      </p>
                      <h3>{stop.name}</h3>
                      {stop.planningBasis && <p className="muted mt-2">{stop.planningBasis}</p>}
                      {stop.scheduleAssumptions?.map((assumption, index) => (
                        <p key={index} className="muted mt-2">방문 가안 · {assumption}</p>
                      ))}
                      {stop.recommendationReason && (
                        <p className="trip-reason">
                          {stop.recommendationReason}
                        </p>
                      )}
                      <p className="muted mt-2">
                        {stop.costKrw === null || !["VERIFIED", "ESTIMATED"].includes(stop.costStatus)
                          ? "비용 미확인"
                          : `${stop.costStatus === "ESTIMATED" ? "예상 " : ""}${stop.costKrw.toLocaleString("ko-KR")}원`}
                      </p>
                      {safeSource(stop.sourceUrl) && (
                        <a
                          className="text-link trip-source"
                          href={stop.sourceUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          공식 출처 확인 ↗
                        </a>
                      )}
                    </div>
                  </article>
                  {(day.legs ?? [])
                    .filter((leg) => leg.fromStopId === stop.id)
                    .map((leg, n) => (
                      <LegView key={n} leg={leg} />
                    ))}
                </div>
              ))
            )}
          </div>
        )}
      </section>
      <section className="section info-card">
        <h2>예산 확인</h2>
        <dl className="trip-summary">
          <dt>총예산</dt>
          <dd>
            {plan.budget.limitKrw === null
              ? "미입력"
              : `${plan.budget.limitKrw.toLocaleString("ko-KR")}원`}
          </dd>
          {plan.budget.estimatedTotalKrw != null && <>
            <dt>예상 총비용</dt>
            <dd className="font-bold text-accent">{plan.budget.estimatedTotalKrw.toLocaleString("ko-KR")}원</dd>
          </>}
          <dt>확인된 비용</dt>
          <dd>{plan.budget.knownTotalKrw.toLocaleString("ko-KR")}원</dd>
          <dt>미확인 항목</dt>
          <dd>{plan.budget.unknownItemCount}건</dd>
        </dl>
        {plan.budget.status === "OVER" && <p className="mt-3 text-accent" role="status">현재 예상 비용이 설정한 예산을 초과해요. 인원·숙박·방문 장소를 조정해 보세요.</p>}
        <p className="muted mt-3">
          {plan.budget.estimatedTotalKrw != null
            ? "예상 총비용은 확인된 금액과 계획용 추정 금액을 합산했습니다. 실제 결제 금액과 다를 수 있어요."
            : "확인된 비용만 합산한 금액이에요. 교통·식사·숙박 등 미확인 비용이 추가될 수 있습니다."}
        </p>
        {!!plan.budget.items?.length && <details className="mt-4">
          <summary>비용 상세 보기</summary>
          <dl className="trip-summary mt-3">
            {plan.budget.items.map((item, index) => <div key={index} className="contents">
              <dt>{item.label}</dt>
              <dd>{item.amountKrw === null ? "미확인" : `${item.status === "ESTIMATED" ? "예상 " : ""}${item.amountKrw.toLocaleString("ko-KR")}원`}</dd>
            </div>)}
          </dl>
        </details>}
      </section>
      <PlanExport key={`${plan.id}:${plan.version}`} plan={plan} />
      <section className="section info-card">
        <h2>입력한 조건</h2>
        <dl className="trip-summary">
          <dt>출발지</dt>
          <dd>{plan.inputSnapshot.origin?.label ?? "출발지 정보 없음"}</dd>
          <dt>교통·인원</dt>
          <dd>
            {plan.inputSnapshot.transport === "CAR" ? "자가용" : "대중교통"} ·{" "}
            {plan.inputSnapshot.travelers}명
          </dd>
          {plan.inputSnapshot.additionalRequests && (
            <>
              <dt>추가 요청</dt>
              <dd>{plan.inputSnapshot.additionalRequests}</dd>
            </>
          )}
        </dl>
      </section>
      {error && (
        <p role="alert" className="field-error mt-4">
          {error}
        </p>
      )}
      <div className="trip-form">
        <button className="button" disabled={busy} onClick={regenerate}>
          {busy ? "재추천 요청 중…" : "같은 조건으로 다시 추천받기"}
        </button>
        <Link
          className="button secondary"
          href={`/trip?festivalId=${encodeURIComponent(plan.inputSnapshot.primaryFestivalId)}`}
        >
          조건을 새로 입력하기
        </Link>
        <Link href="/my/plans" className="text-link">
          저장된 계획 목록
        </Link>
      </div>
    </>
  );
}
function LegView({ leg }: { leg: Leg }) {
  const labels: Record<string, string> = {
    CAR: "자가용",
    PUBLIC_TRANSIT: "대중교통",
    WALK: "도보",
    BUS: "버스",
    SUBWAY: "지하철",
    TRAIN: "열차",
    EXPRESS_BUS: "고속버스",
    INTERCITY_BUS: "시외버스",
    TRANSFER_BUFFER: "승차 준비시간",
  };
  return (
    <div className="trip-leg">
      <p>
        {labels[leg.mode] ?? "이동"} ·{" "}
        {leg.durationMinutes === null
          ? "이동시간 미확인"
          : `예상 ${leg.durationMinutes}분`}
        {leg.distanceMeters !== null
          ? ` · ${(leg.distanceMeters / 1000).toFixed(1)}km`
          : ""}
      </p>
      {leg.departureAt && (
        <p>
          {time(leg.departureAt)} 출발
          {leg.arrivalAt ? ` → ${time(leg.arrivalAt)} 도착` : ""}
        </p>
      )}
      {leg.segments?.map((s, i) => (
        <p key={i}>
          {labels[s.mode] ?? s.mode}
          {s.fromName ? ` · ${s.fromName}` : ""}
          {s.toName ? ` → ${s.toName}` : ""}
          {s.lines?.length
            ? ` (${s.lines
                .map((l) => l.busNo ?? l.name)
                .filter(Boolean)
                .join(", ")})`
            : ""}
          {s.walkabilityStatus === "UNCONFIRMED"
            ? " · 보행 가능 여부 미확인"
            : ""}
        </p>
      ))}
      {leg.serviceTimeStatus === "UNCONFIRMED" && (
        <p>실제 운행 시각·대기시간 확인 필요</p>
      )}
    </div>
  );
}
function time(value: string | null) {
  return value
    ? new Date(value).toLocaleTimeString("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "시간 미정";
}
function safeSource(value: string | null | undefined) {
  if (!value) return false;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
