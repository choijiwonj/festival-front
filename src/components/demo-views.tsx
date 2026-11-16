"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Heart,
  MessageCircle,
  ChevronRight,
  UserRound,
  Bookmark,
  NotebookPen,
  Settings,
} from "lucide-react";
import { isMock } from "@/lib/repository";
import {
  demoPlaces,
  demoPosts,
  demoProfile,
  demoPlans,
  demoSettings,
  demoStops,
} from "@/lib/mock/demo";
import { festivals } from "@/lib/mock/data";
import { Notice } from "./ui";
import { Placeholder } from "./placeholder";
export function DemoNotice() {
  return (
    <div className="demo-banner">
      <span>DEMO</span> 더미 데이터 미리보기 · 실제 조회·저장·로그인 아님
    </div>
  );
}
export function DemoMap() {
  const [category, setCategory] = useState("전체");
  const [selected, setSelected] = useState(demoPlaces[0].id);
  const places = demoPlaces.filter(
    (p) => category === "전체" || p.label === category,
  );
  if (!isMock)
    return (
      <Placeholder
        title="지도 연동 준비 중"
        description="실제 지도·장소 API는 아직 연결되지 않았어요."
      />
    );
  return (
    <>
      <DemoNotice />
      <h1 className="page-title">축제 옆, 작은 발견</h1>
      <p className="muted mb-4">봄빛 정원축제 주변 · 가상 장소 4곳</p>
      <div className="chips mb-4">
        {["전체", "카페", "맛집", "놀거리", "상점"].map((c) => (
          <button
            className="chip"
            key={c}
            aria-pressed={category === c}
            onClick={() => {
              setCategory(c);
              const p = demoPlaces.find((p) => c === "전체" || p.label === c);
              if (p) setSelected(p.id);
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="demo-map" aria-label="실제 지리가 아닌 장소 배치 예시">
        <span className="map-label">가상 장소 배치도 · 실제 지도 아님</span>
        <div className="map-park">봄빛 정원축제</div>
        {places.map((p) => (
          <button
            key={p.id}
            aria-pressed={selected === p.id}
            className={`map-pin pin-${demoPlaces.indexOf(p)}`}
            onClick={() => setSelected(p.id)}
          >
            <MapPin size={18} />
            {p.name}
          </button>
        ))}
      </div>
      <div className="space-y-3 mt-4">
        {places.map((p) => (
          <article
            className={`info-card place-card ${selected === p.id ? "selected" : ""}`}
            key={p.id}
          >
            <button className="place-select" onClick={() => setSelected(p.id)}>
              <span className="eyebrow">
                {p.label} · {p.area}
              </span>
              <h2>{p.name}</h2>
            </button>
            <p>{p.description}</p>
            <p className="muted mt-2">
              {p.hours} · {p.price}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
export function DemoBoard({ mine = false }: { mine?: boolean }) {
  const [opened, setOpened] = useState<string | null>(null);
  const [liked, setLiked] = useState<string[]>([]);
  if (!isMock)
    return (
      <Placeholder
        title="후기 연동 준비 중"
        description="실제 후기 API는 아직 연결되지 않았어요."
      />
    );
  const posts = demoPosts.filter(
    (p) => !mine || p.author.id === demoProfile.id,
  );
  return (
    <>
      <DemoNotice />
      <p className="eyebrow mb-2">동네를 다녀온 이야기</p>
      <h1 className="page-title">
        {mine ? "내가 남긴 여행 이야기" : "우리의 느긋한 주말"}
      </h1>
      <div className="space-y-4">
        {posts.map((p) => (
          <article className="demo-post" key={p.id}>
            <div className="post-author">
              <div className="demo-avatar small">
                <UserRound size={19} />
              </div>
              <div>
                <strong>{p.author.nickname}</strong>
                <p className="muted">{p.createdAt.slice(0, 10)} · 예시 후기</p>
              </div>
            </div>
            <div className={`post-cover ${p.coverUrl ? "" : "illustrated"}`}>
              <Image
                src={p.coverUrl ?? "/assets/village-hero.svg"}
                alt="후기 분위기 예시 이미지"
                width={342}
                height={170}
              />
            </div>
            <div className="post-content">
              <p className="eyebrow">
                {festivals.find((f) => f.id === p.festivalId)?.name}
              </p>
              <button
                className="post-excerpt"
                onClick={() => setOpened(opened === p.id ? null : p.id)}
                aria-expanded={opened === p.id}
              >
                {p.excerpt}
              </button>
              {opened === p.id && <p className="mt-3">{p.body}</p>}
              <div className="post-actions">
                <button
                  onClick={() =>
                    setLiked(
                      liked.includes(p.id)
                        ? liked.filter((id) => id !== p.id)
                        : [...liked, p.id],
                    )
                  }
                  aria-pressed={liked.includes(p.id)}
                  aria-label={`${p.author.nickname} 후기 공감 시연`}
                >
                  <Heart
                    size={17}
                    fill={liked.includes(p.id) ? "currentColor" : "none"}
                  />
                  {p.likeCount + (liked.includes(p.id) ? 1 : 0)}
                </button>
                <span>
                  <MessageCircle size={17} />
                  {p.commentCount}
                </span>
                <span>예시 반응 수</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="muted mt-4">
        공감은 현재 화면에서만 바뀌며 서버에 저장하지 않아요.
      </p>
    </>
  );
}
export function DemoMy() {
  if (!isMock)
    return (
      <Placeholder
        title="마이페이지"
        description="개인 정보 API와 로그인은 연결 준비 중입니다."
      />
    );
  return (
    <>
      <DemoNotice />
      <div className="profile-summary">
        <div className="demo-avatar">
          <UserRound size={30} />
        </div>
        <div>
          <p className="eyebrow">예시 프로필 · 로그인 아님</p>
          <h1 className="text-xl font-bold">{demoProfile.nickname}</h1>
          <p className="muted">다음 주말엔 어느 동네로 떠날까요?</p>
        </div>
      </div>
      <div className="demo-stats">
        <Link href="/my/plans">
          <strong>{demoPlans.length}</strong>
          <span>예시 여행 계획</span>
        </Link>
        <Link href="/my/reviews">
          <strong>
            {demoPosts.filter((p) => p.author.id === demoProfile.id).length}
          </strong>
          <span>예시 내 후기</span>
        </Link>
      </div>
      <div className="my-menu">
        {[
          {
            path: "plans",
            name: "저장된 계획",
            detail: "여행 계획 2개 미리보기",
            icon: Bookmark,
          },
          {
            path: "reviews",
            name: "내 후기",
            detail: "후기 2개 미리보기",
            icon: NotebookPen,
          },
          {
            path: "profile",
            name: "프로필",
            detail: "예시 닉네임과 사진",
            icon: UserRound,
          },
          {
            path: "settings",
            name: "설정",
            detail: "여행 기본값 미리보기",
            icon: Settings,
          },
        ].map(({ path, name, detail, icon: Icon }) => (
          <Link key={path} href={`/my/${path}`} className="festival-row">
            <Icon size={20} className="text-accent" />
            <div className="flex-1">
              <h2 className="text-sm">{name}</h2>
              <p>{detail}</p>
            </div>
            <ChevronRight size={18} />
          </Link>
        ))}
      </div>
    </>
  );
}
export function DemoPlanList() {
  const [opened, setOpened] = useState<string | null>(demoPlans[0].id);
  if (!isMock)
    return (
      <Placeholder
        title="저장된 계획"
        description="실제 개인 계획 API는 연결되지 않았어요."
      />
    );
  return (
    <>
      <DemoNotice />
      <h1 className="page-title">다시 꺼내 보는 여행</h1>
      <div className="space-y-4">
        {demoPlans.map((p) => (
          <article className="info-card" key={p.id}>
            <p className="eyebrow mb-2">예시 계획 · 확인 필요</p>
            <h2>{p.title}</h2>
            <p className="muted">
              {p.startDate} — {p.endDate} · {p.travelers}명
            </p>
            <p className="muted mt-2">
              예시 추정액 {p.estimatedCostKrw.toLocaleString()}원 / 총예산{" "}
              {p.budgetKrw.toLocaleString()}원
            </p>
            <button
              className="text-link"
              aria-expanded={opened === p.id}
              onClick={() => setOpened(opened === p.id ? null : p.id)}
            >
              {opened === p.id ? "일정 접기" : "예시 일정 보기"}
            </button>
            {opened === p.id && (
              <DemoItinerary
                days={p.startDate===p.endDate?1:2}
                festivalName={
                  festivals.find((f) => f.id === p.festivalId)?.name ??
                  "선택한 축제"
                }
              />
            )}
          </article>
        ))}
      </div>
    </>
  );
}
export function DemoItinerary({
  festivalName,
  days = 2,
}: {
  festivalName: string;
  days?: number;
}) {
  const [day, setDay] = useState(1);
  return (
    <div className="mt-4">
      <div className="chips mb-4">
        {Array.from({ length: Math.min(days, 2) }, (_, i) => i + 1).map((d) => (
          <button
            className="chip"
            key={d}
            aria-pressed={day === d}
            onClick={() => setDay(d)}
          >
            DAY {d}
          </button>
        ))}
      </div>
      <ol className="demo-timeline">
        {(day === 1
          ? demoStops(festivalName)
          : [
              {
                time: "09:00",
                name: "동네 아침 산책",
                note: "가상 일정 · 60분",
              },
              { time: "11:00", name: "로컬 장터", note: "가상 일정 · 90분" },
              {
                time: "14:00",
                name: "여행 마무리",
                note: "실제 복귀 경로·소요시간 미확인",
              },
            ]
        ).map((s) => (
          <li key={s.time}>
            <time>{s.time}</time>
            <div>
              <strong>{s.name}</strong>
              <p className="muted">{s.note}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="muted mt-3">
        고정된 더미 일정입니다. AI가 생성하지 않았으며 이동·비용은 검증되지
        않았어요.
      </p>
    </div>
  );
}
export function DemoProfile() {
  const [nickname, setNickname] = useState(demoProfile.nickname);
  const [message, setMessage] = useState("");
  if (!isMock)
    return (
      <Placeholder
        title="프로필"
        description="실제 프로필 API는 연결되지 않았어요."
      />
    );
  function submit(e: FormEvent) {
    e.preventDefault();
    setMessage(
      nickname.trim().length < 2 || nickname.trim().length > 20
        ? "닉네임은 2~20자로 입력해 주세요."
        : "미리보기에 반영했어요. 서버에는 저장되지 않습니다.",
    );
  }
  return (
    <>
      <DemoNotice />
      <h1 className="page-title">나를 소개해요</h1>
      <div className="profile-summary">
        <div className="demo-avatar">
          <UserRound size={30} />
        </div>
        <strong>{nickname || "예시 여행자"}</strong>
      </div>
      <form className="filter-panel mt-5" onSubmit={submit}>
        <label>
          닉네임
          <input
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setMessage("");
            }}
            maxLength={20}
            required
            minLength={2}
          />
        </label>
        <button className="button">미리보기 적용</button>
        <p className="muted">
          예시 입력 화면으로, 사진 업로드·실제 저장은 연결되지 않았어요.
        </p>
        {message && <p role="status">{message}</p>}
      </form>
    </>
  );
}
export function DemoSettings() {
  const [transport, setTransport] = useState(
    demoSettings.travelDefaults.transport,
  );
  const [travelers, setTravelers] = useState(
    demoSettings.travelDefaults.travelers,
  );
  const [lodging, setLodging] = useState(
    demoSettings.travelDefaults.lodgingPreference,
  );
  const [message, setMessage] = useState("");
  if (!isMock)
    return (
      <Placeholder
        title="설정"
        description="실제 설정 API는 연결되지 않았어요."
      />
    );
  return (
    <>
      <DemoNotice />
      <h1 className="page-title">나에게 맞는 여행 준비</h1>
      <form
        className="filter-panel"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage("현재 화면에만 적용했어요. 서버에는 저장되지 않습니다.");
        }}
      >
        <label>
          교통수단
          <select
            value={transport}
            onChange={(e) => {
              setTransport(e.target.value);
              setMessage("");
            }}
          >
            <option value="CAR">자차</option>
            <option value="PUBLIC_TRANSIT">대중교통</option>
          </select>
        </label>
        <label>
          여행 인원
          <input
            type="number"
            min={1}
            max={20}
            required
            value={travelers}
            onChange={(e) => {
              setTravelers(Number(e.target.value));
              setMessage("");
            }}
          />
        </label>
        <label>
          숙박 선호
          <select
            value={lodging}
            onChange={(e) => {
              setLodging(e.target.value);
              setMessage("");
            }}
          >
            <option value="PENSION">펜션</option>
            <option value="HOTEL">호텔</option>
            <option value="GUESTHOUSE">게스트하우스</option>
            <option value="ANY">상관없음</option>
            <option value="SELF_ARRANGED">직접 준비</option>
          </select>
        </label>
        <div>
          <p className="muted">관심사 예시</p>
          <div className="chips mt-2">
            <span className="chip">자연</span>
            <span className="chip">카페</span>
          </div>
        </div>
        <Notice>기본 출발지 저장: 꺼짐 · 저장된 출발지 없음</Notice>
        <button className="button">미리보기 적용</button>
        {message && <p role="status">{message}</p>}
      </form>
    </>
  );
}
