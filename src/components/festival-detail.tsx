"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { festivalRepository } from "@/lib/repository";
import { regions, type Source } from "@/lib/types";
import { useResource } from "@/lib/use-resource";
import { Loading, ErrorState, Notice } from "./ui";
function SourceInfo({ source }: { source: Source }) {
  const safeUrl = source.sourceUrl?.startsWith("https://")
    ? source.sourceUrl
    : null;
  return (
    <p className="source-info">
      출처:{" "}
      {safeUrl ? (
        <a href={safeUrl} target="_blank" rel="noreferrer">
          원문 확인 ↗
        </a>
      ) : (
        "미확인"
      )}{" "}
      · 확인 시각:{" "}
      {source.lastVerifiedAt
        ? new Date(source.lastVerifiedAt).toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
          })
        : "미확인"}
    </p>
  );
}
export function FestivalDetailView({ id }: { id: string }) {
  const result = useResource(
    useCallback(
      (signal: AbortSignal) => festivalRepository.detail(id, signal),
      [id],
    ),
  );
  const programs = useResource(
    useCallback(
      (signal: AbortSignal) => festivalRepository.programs(id, signal),
      [id],
    ),
  );
  const [tab, setTab] = useState("소개");
  if (result.loading) return <Loading />;
  if (result.error)
    return (
      <>
        <ErrorState message={result.error.message} retry={result.retry} />
        <Link href="/festivals" className="text-link">
          전체 축제로 돌아가기
        </Link>
      </>
    );
  const f = result.data!.data;
  const illustration = !f.thumbnailUrl;
  return (
    <>
      <div className={`detail-image ${illustration ? "illustration" : ""}`}>
        <Image
          src={f.thumbnailUrl || "/assets/village-hero.svg"}
          alt={
            illustration ? "작은 마을 기본 일러스트" : `${f.name} 분위기 이미지`
          }
          fill
          sizes="(max-width: 480px) 90vw, 432px"
          unoptimized={Boolean(f.thumbnailUrl)}
          priority
        />
      </div>
      <p className="eyebrow mt-4">
        {regions[f.region]} ·{" "}
        {f.tags
          .map(
            (t) =>
              ({
                NATURE: "자연",
                CULTURE: "문화",
                FOOD: "먹거리",
                CAFE: "카페",
                EXPERIENCE: "체험",
                SHOPPING: "쇼핑",
              })[t],
          )
          .join(" · ")}
      </p>
      <h1 className="page-title mt-5">{f.name}</h1>
      <p className="font-bold">
        {f.startDate.replaceAll("-", ".")} — {f.endDate.replaceAll("-", ".")}
      </p>
      <p className="muted mt-4">
        {f.venue?.label ?? "장소 미확인"} /{" "}
        {f.admission?.amountKrw == null
          ? "입장료 미확인"
          : f.admission.amountKrw === 0
            ? "무료"
            : `${f.admission.amountKrw.toLocaleString("ko-KR")}원`}
        {f.admission?.basis && ` (${({ PERSON: "1인", GROUP: "일행", ROOM: "객실" } as Record<string, string>)[f.admission.basis] ?? f.admission.basis})`}
      </p>
      <div className="chips my-5" role="tablist" aria-label="축제 정보">
        {["소개", "프로그램", "교통"].map((t) => (
          <button
            className="chip"
            role="tab"
            key={t}
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls="festival-panel"
            tabIndex={tab === t ? 0 : -1}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                const tabs = ["소개", "프로그램", "교통"];
                const next =
                  tabs[
                    (tabs.indexOf(t) + (e.key === "ArrowRight" ? 1 : 2)) % 3
                  ];
                setTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }
            }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <section
        id="festival-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="space-y-4"
      >
        {tab === "소개" && (
          <>
            <p className="whitespace-pre-line leading-relaxed">{f.description || "축제 소개가 아직 확인되지 않았어요."}</p>
            <article className="info-card space-y-3">
              <h2>운영 안내</h2>
              <p className="whitespace-pre-line">{f.openingHours ?? "운영시간은 주최측 공고에서 확인해 주세요."}</p>
              {f.contact && <p className="muted">{f.contact.label} · <a className="text-link" href={`tel:${f.contact.phone}`}>{f.contact.phone}</a></p>}
            </article>
            {f.admission?.description && <article className="info-card space-y-3">
              <h2>입장권 · 요금 안내</h2><p>{f.admission.description}</p>
              {f.admission.sourceUrl && <SourceInfo source={{ sourceUrl: f.admission.sourceUrl, lastVerifiedAt: f.admission.lastVerifiedAt ?? null }} />}
            </article>}
            {!!f.sources?.length && <div className="info-card space-y-2"><h2>공식 안내</h2>
              {f.sources.filter((source) => source.url.startsWith("https://")).map((source) => <a key={source.url} className="text-link block" href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}
            </div>}
            <SourceInfo source={f} />
          </>
        )}
        {tab === "프로그램" && (
          <>
            {f.highlights?.map((highlight) => <article className="info-card space-y-2" key={highlight.title}>
              <h2>{highlight.title}</h2><p>{highlight.description}</p>
              <SourceInfo source={{ sourceUrl: highlight.sourceUrl, lastVerifiedAt: f.lastVerifiedAt }} />
            </article>)}
            {programs.loading ? (
              <Loading />
            ) : programs.error ? (
              <ErrorState
                message={programs.error.message}
                retry={programs.retry}
              />
            ) : !programs.data?.data.length ? (
              <Notice>
                {f.programNotice ?? "등록된 프로그램이 없어요. 운영처의 최신 안내를 확인해 주세요."}
              </Notice>
            ) : (
              programs.data.data.map((p) => (
                <article className="info-card" key={p.id}>
                  <h2>{p.name}</h2>
                  <p>
                    {p.startAt
                      ? new Date(p.startAt).toLocaleString("ko-KR", {
                          timeZone: "Asia/Seoul",
                        })
                      : "시간 미정"}
                  </p>
                  <p className="muted">
                    비용:{" "}
                    {p.costKrw === null
                      ? "미확인"
                      : p.costKrw === 0
                        ? "무료"
                        : `${p.costKrw.toLocaleString()}원`}{" "}
                    · 예약:{" "}
                    {p.reservationRequired === null
                      ? "미확인"
                      : p.reservationRequired
                        ? "필요"
                        : "불필요"}
                  </p>
                  <SourceInfo source={p} />
                </article>
              ))
            )}
            {(f.booths.length > 0 || !f.highlights?.length) && <Notice>
              <h2>부스 안내</h2>
              {f.booths.length ? (
                f.booths.map((b) => (
                  <div key={b.id}>
                    <p>{b.name}</p>
                    <SourceInfo source={b} />
                  </div>
                ))
              ) : (
                <p>부스 정보 미확인</p>
              )}
            </Notice>}
            {(f.lineup.length > 0 || !f.highlights?.length) && <Notice>
              <h2>공연 라인업</h2>
              {f.lineup.length ? (
                f.lineup.map((l) => (
                  <div key={l.id}>
                    <p>{l.name}</p>
                    <SourceInfo source={l} />
                  </div>
                ))
              ) : (
                <p>공연 라인업 미확인</p>
              )}
            </Notice>}
          </>
        )}
        {tab === "교통" && (
          <>
            <Notice>
              <h2>오시는 길</h2>
              <p className="whitespace-pre-line">{f.directions?.description ?? "교통 정보 미확인"}</p>
              {f.directions && <SourceInfo source={f.directions} />}
            </Notice>
            <Notice>
              <h2>셔틀 안내</h2>
              <p>{f.shuttle?.description ?? "셔틀 운행 정보 미확인"}</p>
              {f.shuttle && <SourceInfo source={f.shuttle} />}
            </Notice>
            <p className="muted">방문 전 운영처의 최신 안내를 확인해 주세요.</p>
          </>
        )}
      </section>
      <div className="detail-bottom-space" />
      <div className="detail-action">
        <p>선택한 축제를 중심으로 주변 장소를 연결해요.</p>
        {f.status === "CANCELLED" ? (
          <button className="button" disabled>
            취소된 축제는 선택할 수 없어요
          </button>
        ) : (
          <Link
            href={`/trip?festivalId=${encodeURIComponent(f.id)}`}
            className="button"
          >
            이 축제로 AI 여행 코스 추천받기
          </Link>
        )}
      </div>
    </>
  );
}
