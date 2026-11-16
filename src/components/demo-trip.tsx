"use client";
import { useState, type FormEvent } from "react";
import type { FestivalDetail } from "@/lib/types";
import { DemoNotice, DemoItinerary } from "./demo-views";
import { Notice } from "./ui";
export function DemoTrip({ festival }: { festival: FestivalDetail }) {
  const [start, setStart] = useState(festival.startDate);
  const [end, setEnd] = useState(festival.startDate);
  const [origin, setOrigin] = useState("예시 출발역");
  const [transport, setTransport] = useState("CAR");
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState("300000");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const days = (Date.parse(end) - Date.parse(start)) / 86400000 + 1;
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!start || !end || end < start) {
      setError("시작일과 종료일을 확인해 주세요.");
      return;
    }
    if (
      start < festival.dateSelection.min ||
      end > festival.dateSelection.max ||
      start > festival.endDate ||
      end < festival.startDate
    ) {
      setError("축제 전후 2일 안에서 축제 개최일을 하루 이상 포함해 주세요.");
      return;
    }
    if (days > 2) {
      setError("현재 예시 일정은 당일 또는 1박 2일로 확인할 수 있어요.");
      return;
    }
    setError("");
    setPreview(true);
  }
  return (
    <>
      <DemoNotice />
      <p className="eyebrow mb-2">선택한 축제 · {festival.name}</p>
      <h1 className="page-title">
        {preview ? "이렇게 떠나 볼까요?" : "어떻게 떠나세요?"}
      </h1>
      {preview ? (
        <>
          <Notice>
            <h2>예시 여행 조건</h2>
            <p>
              {start} — {end} · {days}일 · {travelers}명<br />
              {origin} 출발 · {transport === "CAR" ? "자차" : "대중교통"} ·{" "}
              {budget
                ? `총예산 ${Number(budget).toLocaleString()}원`
                : "예산 제한 없음"}
            </p>
          </Notice>
          <DemoItinerary
            key={`${festival.id}-${days}`}
            festivalName={festival.name}
            days={days}
          />
          <button
            className="button secondary mt-5"
            onClick={() => setPreview(false)}
          >
            조건 다시 보기
          </button>
        </>
      ) : (
        <form className="filter-panel" onSubmit={submit}>
          <div className="date-grid">
            <label>
              여행 시작일
              <input
                type="date"
                required
                value={start}
                min={festival.dateSelection.min}
                max={festival.dateSelection.max}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              여행 종료일
              <input
                type="date"
                required
                value={end}
                min={festival.dateSelection.min}
                max={festival.dateSelection.max}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>
          <label>
            출발지 예시
            <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
              <option>예시 출발역</option>
              <option>예시 버스터미널</option>
            </select>
          </label>
          <label>
            교통수단
            <select
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
            >
              <option value="CAR">자차</option>
              <option value="PUBLIC_TRANSIT">대중교통</option>
            </select>
          </label>
          <div className="date-grid">
            <label>
              여행 인원
              <input
                type="number"
                min={1}
                max={20}
                required
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value))}
              />
            </label>
            <label>
              총예산 (원)
              <input
                type="number"
                min={0}
                step={1}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </label>
          </div>
          <Notice>
            입력한 조건을 확인한 후 고정 예시 일정을 보여드려요. AI
            호출·로그인·서버 저장은 실행하지 않습니다.
          </Notice>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <button className="button" type="submit">
            더미 여행 일정 보기
          </button>
        </form>
      )}
    </>
  );
}
