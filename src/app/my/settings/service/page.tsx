import { Notice } from "@/components/ui";
export default function Page() {
  return (
    <>
      <h1 className="page-title">함께 만드는 충남 여행</h1>
      <Notice>
        서비스 안내를 준비하고 있어요. 게시된 문서와 문의 채널이 연결되면
        여기에서 확인할 수 있습니다.
      </Notice>
      <div className="my-menu">
        {[
          "공지사항",
          "문의하기",
          "이용약관",
          "개인정보 처리방침",
          "관광 정보 출처",
        ].map((title) => (
          <div className="festival-row" key={title}>
            <div>
              <h2 className="text-sm">{title}</h2>
              <p>준비 중</p>
            </div>
          </div>
        ))}
      </div>
      <p className="muted mt-5">
        축제 일정과 장소 정보는 방문 전 해당 운영처의 최신 안내를 확인해 주세요.
      </p>
    </>
  );
}
