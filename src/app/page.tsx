"use client";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useState } from "react";
import { festivalRepository } from "@/lib/repository";
import { categories, regions, type Interest } from "@/lib/types";
import { useResource } from "@/lib/use-resource";
import {
  SectionHeading,
  FestivalRow,
  Loading,
  ErrorState,
  EmptyState,
  formatDates,
} from "@/components/ui";
import { FestivalSearch } from "@/components/festival-search";
export default function Home() {
  const [interest, setInterest] = useState<Interest | null>(null);
  const recommendations = useResource(
    useCallback(
      (signal: AbortSignal) => festivalRepository.recommendations({}, signal),
      [],
    ),
  );
  const all = useResource(
    useCallback(
      (signal: AbortSignal) =>
        festivalRepository.list(
          { interests: interest ? [interest] : [] },
          signal,
        ),
      [interest],
    ),
  );
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">작은 동네로 떠나는 주말</p>
        <h1 id="hero-title">
          들길 지나 골목으로,
          <br />
          마음이 쉬는 여행.
        </h1>
        <p className="hero-description">
          축제도 보고, 장터도 들르고.
          <br />
          충남의 느긋한 하루를 만나세요.
        </p>
        <Image
          src="/assets/village-hero.svg"
          width={302}
          height={94}
          alt=""
          className="hero-art"
          priority
        />
      </section>
      <FestivalSearch />
      <section className="section">
        <SectionHeading title="이번엔 이 동네 어때요?" label="추천 축제" />
        {recommendations.loading ? (
          <Loading />
        ) : recommendations.error ? (
          <ErrorState
            message={recommendations.error.message}
            retry={recommendations.retry}
          />
        ) : !recommendations.data?.data.length ? (
          <EmptyState />
        ) : (
          <div className="recommendation-grid">
            {recommendations.data.data.map((f, i) => (
              <Link
                href={`/festivals/${f.id}`}
                className="recommendation-card"
                key={f.id}
              >
                <div className={`card-art ${i % 2 ? "rose" : ""}`}>
                  {f.thumbnailUrl ? (
                    <Image
                      src={f.thumbnailUrl}
                      width={141}
                      height={66}
                      alt=""
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/assets/village-card.svg"
                      width={141}
                      height={66}
                      alt=""
                    />
                  )}
                </div>
                <h3>{f.name}</h3>
                <p>
                  {regions[f.region]} · {formatDates(f.startDate, f.endDate)}
                </p>
                <p>{f.recommendationReason}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="section">
        <SectionHeading
          title="충남 곳곳의 축제"
          href="/festivals"
          label="전체 목록"
        />
        <div className="chips" aria-label="축제 관심사">
          {categories.map((c) => (
            <button
              key={c.label}
              aria-pressed={(interest ?? "") === c.value}
              onClick={() => setInterest(c.value || null)}
              className="chip"
            >
              {c.label}
            </button>
          ))}
        </div>
        {all.loading ? (
          <Loading />
        ) : all.error ? (
          <ErrorState message={all.error.message} retry={all.retry} />
        ) : !all.data?.data.length ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {all.data.data.slice(0, 3).map((f) => (
              <FestivalRow key={f.id} festival={f} />
            ))}
          </div>
        )}
        <Link href="/festivals" className="text-link mt-3">
          전체 축제 찾아보기 <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </>
  );
}
