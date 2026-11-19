"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { tripApi } from "@/lib/api/trips";
import { ApiError } from "@/lib/api/client";
import { generationOutcome, stageLabels, type Job } from "@/lib/trips";
import { RequireAuth } from "./require-auth";
import { Notice } from "./ui";
export function GenerationProgress({ id }: { id: string }) {
  return (
    <RequireAuth>
      <Progress key={id} id={id} />
    </RequireAuth>
  );
}
function Progress({ id }: { id: string }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null),
    [error, setError] = useState(""),
    [slow, setSlow] = useState(false),
    [round, setRound] = useState(0);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const started = Date.now();
    let delay = 2000;
    setError("");
    setSlow(false);
    setJob(null);
    async function tick() {
      try {
        const result = await tripApi.job(
          id,
          AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        );
        if (!active) return;
        setJob(result.data);
        setError("");
        const outcome = generationOutcome(result.data);
        if (outcome === "success") {
          router.replace(
            `/my/plans/${encodeURIComponent(result.data.result!.planId!)}`,
          );
          return;
        }
        if (outcome === "invalid") {
          setError(
            "작업은 완료됐지만 여행 계획을 확인하지 못했어요. 저장된 계획에서 확인해 주세요.",
          );
          return;
        }
        if (outcome === "failed") return;
        if (Date.now() - started >= 180000) {
          setSlow(true);
          return;
        }
      } catch (e) {
        if (!active) return;
        if (Date.now() - started >= 180000) {
          setSlow(true);
          return;
        }
        if (!(e instanceof ApiError) || !e.retryable) {
          setError(
            e instanceof Error ? e.message : "진행 상태를 확인하지 못했어요.",
          );
          return;
        }
        setError("연결이 잠시 끊겼어요. 진행 상태를 다시 확인하고 있어요.");
      }
      if (active) {
        timer = setTimeout(tick, delay);
        delay = Math.min(delay * 1.5, 10000);
      }
    }
    void tick();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [id, round, router]);
  const failed = job?.status === "FAILED";
  return (
    <section className="generation-panel">
      <div className="account-avatar">
        <LoaderCircle
          size={28}
          className={!failed && !slow && !error ? "trip-spinner" : undefined}
        />
      </div>
      <p className="eyebrow">나의 여행 준비</p>
      <h1 className="page-title">
        {failed
          ? "여행 계획을 만들지 못했어요"
          : slow
            ? "예상보다 오래 걸리고 있어요"
            : "여행 계획을 만드는 중이에요"}
      </h1>
      {failed ? (
        <p role="alert">
          {job.error?.message ??
            "생성 중 오류가 발생했어요. 여행 조건을 확인하고 다시 요청해 주세요."}
        </p>
      ) : slow ? (
        <p role="status">
          작업이 계속 진행 중일 수 있어요. 상태를 다시 확인하거나 마이페이지에서
          이어서 확인할 수 있습니다.
        </p>
      ) : (
        <p role="status" aria-live="polite">
          {job
            ? (stageLabels[job.stage] ?? "여행 계획 처리 중")
            : "진행 상태 확인 중…"}
        </p>
      )}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <Notice>
        {failed
          ? "생성을 완료하지 못한 요청이에요. 여행 조건을 다시 입력해 새 계획을 요청할 수 있습니다."
          : "이 화면을 벗어나도 서버에 접수된 요청은 취소되지 않아요. 완료된 계획은 저장된 계획에서 확인할 수 있습니다."}
      </Notice>
      {(slow || error) && !failed && (
        <button
          type="button"
          className="button"
          onClick={() => setRound((n) => n + 1)}
        >
          진행 상태 다시 확인
        </button>
      )}
      {failed && job.festivalId && (
        <Link
          className="button"
          href={`/trip?festivalId=${encodeURIComponent(job.festivalId)}`}
        >
          여행 조건 다시 입력
        </Link>
      )}
      <Link className="button secondary" href="/my">
        마이페이지에서 확인
      </Link>
      <Link className="text-link" href="/my/plans">
        저장된 계획 보기
      </Link>
    </section>
  );
}
