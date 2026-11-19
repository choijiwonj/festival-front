"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowUpRight, Flower2, Waves, Landmark, Utensils, MapPin } from "lucide-react";
import { exploreApi, type Post } from "@/lib/explore";
import { regions } from "@/lib/types";
import { useResource } from "@/lib/use-resource";
import { ErrorState, Loading } from "./ui";

function Cover({ post }: { post: Post }) {
  const Icon = post.region === "TAEAN" ? Flower2 : post.region === "BORYEONG" ? Waves : post.region === "YESAN" ? Utensils : Landmark;
  return <div className={`board-cover board-cover-${post.region.toLowerCase()}`} aria-hidden="true">
    <span className="board-cover-orbit" /><Icon size={65} strokeWidth={1} />
    <span className="board-cover-label">{regions[post.region]}에서 보낸 하루</span>
  </div>;
}
export function TravelBoard() {
  const [region, setRegion] = useState("");
  const result = useResource(useCallback((signal: AbortSignal) => exploreApi.posts(region, signal), [region]));
  return <>
    <p className="eyebrow">축제 너머, 우리들의 여행</p>
    <h1 className="page-title">여행의 이야기</h1>
    <p className="muted mt-2">어떤 하루를 보내셨나요?<br />충남에서의 여행 이야기를 만나보세요.</p>
    <label className="board-filter mt-5"><span>어느 동네 이야기인가요?</span>
      <select value={region} onChange={(event) => setRegion(event.target.value)}><option value="">충남 전체</option>{Object.entries(regions).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select>
    </label>
    <section className="section" aria-live="polite" aria-busy={result.loading}>
      {result.loading ? <Loading /> : result.error ? <ErrorState message={result.error.message} retry={result.retry} /> : !result.data?.data.length ? <div className="state-card"><h2>아직 이 동네 이야기가 없어요.</h2><p className="muted mt-2">다른 지역의 여행 이야기도 만나보세요.</p></div> : <div className="board-grid">
        {result.data.data.map((post) => <Link className="board-card" key={post.id} href={`/board/${encodeURIComponent(post.id)}`}>
          <Cover post={post} />
          <div className="board-card-body">
            <div className="explore-list-heading"><span className="eyebrow">{regions[post.region]} · {post.festivalName}</span></div>
            <h2>{post.title}</h2><p className="board-excerpt muted">{post.excerpt}</p>
            <div className="board-byline"><span>{post.author.nickname}</span><ArrowUpRight size={18} aria-hidden="true" /></div>
          </div>
        </Link>)}
      </div>}
    </section>
  </>;
}

export function BoardPost({ id }: { id: string }) {
  const result = useResource(useCallback((signal: AbortSignal) => exploreApi.post(id, signal), [id]));
  if (result.loading) return <Loading />;
  if (result.error) return <ErrorState message={result.error.message} retry={result.retry} />;
  const post = result.data!.data;
  return <article>
    <p className="eyebrow">{regions[post.region]} · {post.festivalName}</p>
    <h1 className="page-title mt-2">{post.title}</h1>
    <p className="muted mt-3">{post.author.nickname}</p>
    <div className="mt-5"><Cover post={post} /></div>
    <p className="eyebrow mt-4">방문일 · {post.visitedOn}</p>
    <div className="board-body mt-5">{post.body.split("\n\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    {post.festivalId && <Link className="button secondary mt-6 w-full" href={`/festivals/${encodeURIComponent(post.festivalId)}`}><MapPin size={17} />축제 정보 확인하기</Link>}
    <Link className="text-link block mt-5" href="/board">여행 이야기 목록으로</Link>
  </article>;
}
