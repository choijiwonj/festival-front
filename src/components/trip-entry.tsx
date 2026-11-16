"use client";
import Link from "next/link";
import { useCallback } from "react";
import { festivalRepository } from "@/lib/repository";
import { useResource } from "@/lib/use-resource";
import { Loading, ErrorState, Notice } from "./ui";
export function TripEntry({ festivalId }: { festivalId?: string }) {
  if (!festivalId)
    return (
      <>
        <h1 className="page-title">먼저 축제를 선택해 주세요</h1>
        <Notice>
          축제 상세에서 축제를 선택하면 여행 준비를 시작할 수 있어요.
        </Notice>
        <Link href="/festivals" className="button mt-5">
          축제 찾아보기
        </Link>
      </>
    );
  return <SelectedFestival id={festivalId} />;
}
function SelectedFestival({ id }: { id: string }) {
  const result = useResource(
    useCallback((s: AbortSignal) => festivalRepository.detail(id, s), [id]),
  );
  if (result.loading) return <Loading />;
  if (result.error)
    return (
      <>
        <ErrorState message={result.error.message} retry={result.retry} />
        <Link href="/festivals" className="text-link">
          축제 다시 선택하기
        </Link>
      </>
    );
  const festival = result.data!.data;
  return (
    <>
      <p className="eyebrow mb-3">선택한 축제</p>
      <h1 className="page-title">{festival.name}</h1>
      <Notice>
        {festival.status === "CANCELLED"
          ? "취소된 축제는 여행 조건 입력을 시작할 수 없어요."
          : "축제 선택이 확인되었어요. 여행 조건 입력·로그인·AI 생성은 다음 구현 단계에서 연결됩니다. 현재 계획은 생성되거나 저장되지 않습니다."}
      </Notice>
      <Link href={`/festivals/${id}`} className="text-link mt-4">
        축제 상세로 돌아가기
      </Link>
    </>
  );
}
