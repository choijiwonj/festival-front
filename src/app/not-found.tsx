import Link from "next/link";
export default function NotFound() {
  return (
    <>
      <h1 className="page-title">길을 찾지 못했어요</h1>
      <p>존재하지 않는 화면입니다.</p>
      <Link href="/" className="button mt-6">
        홈으로 돌아가기
      </Link>
    </>
  );
}
