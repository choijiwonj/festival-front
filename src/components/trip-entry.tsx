"use client";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { festivalRepository } from "@/lib/repository";
import { useResource } from "@/lib/use-resource";
import { accountApi } from "@/lib/api/account";
import { tripApi } from "@/lib/api/trips";
import { ApiError } from "@/lib/api/client";
import {
  initialTrip,
  tripDateError,
  tripError,
  tripPayload,
  pickableProgram,
  interestLabels,
  lodgingLabels,
  type TripForm,
  type Place,
  type ValidationResult,
} from "@/lib/trips";
import type { FestivalDetail } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { RequireAuth } from "./require-auth";
import { OriginPicker, PlacePicker } from "./trip-search";
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
  return <SelectedFestival key={festivalId} id={festivalId} />;
}
function SelectedFestival({ id }: { id: string }) {
  const result = useResource(
    useCallback(
      (signal: AbortSignal) => festivalRepository.detail(id, signal),
      [id],
    ),
  );
  if (result.loading) return <Loading />;
  if (result.error)
    return <ErrorState message={result.error.message} retry={result.retry} />;
  const festival = result.data!.data;
  if (festival.status === "CANCELLED")
    return (
      <>
        <h1 className="page-title">{festival.name}</h1>
        <Notice>취소된 축제는 여행을 시작할 수 없어요.</Notice>
        <Link className="text-link" href="/festivals">
          다른 축제 찾기
        </Link>
      </>
    );
  return (
    <RequireAuth
      returnTo={`/trip?festivalId=${encodeURIComponent(id)}`}
      message="선택한 축제로 여행 계획을 만들려면 로그인이 필요해요. 로그인 후 조건 입력을 이어갈 수 있어요."
    >
      <TripWizard festival={festival} />
    </RequireAuth>
  );
}
function TripWizard({ festival }: { festival: FestivalDetail }) {
  const router = useRouter();
  const { session } = useAuth();
  const [form, setForm] = useState<TripForm>(() => initialTrip(festival)),
    [step, setStep] = useState(0),
    [checked, setChecked] = useState<ValidationResult | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [defaultsFailed, setDefaultsFailed] = useState(false),
    [places, setPlaces] = useState<Place[]>([]);
  const touched = useRef(new Set<keyof TripForm>()),
    idempotency = useRef<string | null>(null),
    pending = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  const programs = useResource(
    useCallback(
      (signal: AbortSignal) => festivalRepository.programs(festival.id, signal),
      [festival.id],
    ),
  );
  const [defaultsRound, setDefaultsRound] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setDefaultsFailed(false);
    accountApi.settings(controller.signal).then(
      (response) => {
        if (controller.signal.aborted) return;
        const d = response.data.travelDefaults;
        setForm((old) => {
          const next = { ...old };
          const defaults: Partial<TripForm> = {
            origin: d.origin,
            transport: d.transport ?? undefined,
            travelers: d.travelers ?? undefined,
            interests: d.interests.length ? d.interests : undefined,
            style: d.style ?? undefined,
            lodgingPreference: d.lodgingPreference ?? undefined,
          };
          for (const key of Object.keys(defaults) as (keyof TripForm)[]) {
            const value = defaults[key];
            if (
              value !== undefined &&
              value !== null &&
              !touched.current.has(key)
            )
              Object.assign(next, { [key]: value });
          }
          return next;
        });
      },
      () => {
        if (!controller.signal.aborted) setDefaultsFailed(true);
      },
    );
    return () => controller.abort();
  }, [defaultsRound]);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  function update(patch: Partial<TripForm>) {
    for (const key of Object.keys(patch) as (keyof TripForm)[])
      touched.current.add(key);
    setForm((old) => {
      const next = { ...old, ...patch };
      if (patch.startDate !== undefined || patch.endDate !== undefined)
        next.requiredProgramIds = next.requiredProgramIds.filter((id) =>
          programs.data?.data.some(
            (p) => p.id === id && pickableProgram(p, next),
          ),
        );
      return next;
    });
    setChecked(null);
    idempotency.current = null;
    setError("");
  }
  function nextBasics(e: FormEvent) {
    e.preventDefault();
    const message =
      tripDateError(form, festival) ||
      (!form.origin ? "출발지를 검색한 뒤 결과에서 선택해 주세요." : null);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    // Late defaults must not change conditions after the user accepted step 1.
    for (const key of Object.keys(form) as (keyof TripForm)[])
      touched.current.add(key);
    setStep(1);
  }
  async function check(e: FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    const message = tripError(form, festival);
    if (message) {
      setError(message);
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await tripApi.validate(
        tripPayload(form),
        session?.csrfToken ?? null,
      );
      if (!result.data.valid)
        throw new Error("여행 조건을 다시 확인해 주세요.");
      setChecked(result.data);
      setStep(2);
    } catch (e) {
      setError(errorText(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function create() {
    if (pending.current || !checked) return;
    pending.current = true;
    setBusy(true);
    setError("");
    idempotency.current ??= crypto.randomUUID();
    try {
      const result = await tripApi.create(
        checked.normalizedInput,
        session?.csrfToken ?? null,
        idempotency.current,
      );
      router.push(`/jobs/${encodeURIComponent(result.data.jobId)}`);
    } catch (e) {
      setError(errorText(e));
      if (e instanceof ApiError && e.status === 422) {
        setChecked(null);
        idempotency.current = null;
        setStep(1);
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const overnight = form.startDate !== form.endDate;
  return (
    <>
      <p className="eyebrow mb-2">선택한 축제 · {festival.name}</p>
      <h1 className="page-title" ref={heading} tabIndex={-1}>
        {
          [
            "어떤 여행을 떠날까요?",
            "취향을 더해 주세요",
            "이 조건으로 떠나볼까요?",
          ][step]
        }
      </h1>
      <ol className="trip-steps" aria-label="여행 조건 입력 단계">
        {["기본 조건", "취향과 필수 일정", "입력 확인"].map((label, i) => (
          <li key={label} aria-current={step === i ? "step" : undefined}>
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      {festival.status === "ENDED" && (
        <Notice>
          종료된 축제예요. 표시된 개최일은 실제 과거 일정이며, 새 행사 일정은
          공식 안내를 확인해 주세요.
        </Notice>
      )}
      {defaultsFailed && (
        <div className="notice mt-3">
          <p>
            저장한 여행 기본값을 불러오지 못했어요. 직접 입력하거나 다시 불러올
            수 있어요.
          </p>
          <button
            type="button"
            className="text-link"
            onClick={() => setDefaultsRound((n) => n + 1)}
          >
            기본값 다시 불러오기
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="field-error trip-error">
          {error}
        </p>
      )}
      {step === 0 && (
        <form className="trip-form" onSubmit={nextBasics}>
          <fieldset className="filter-panel">
            <legend className="sr-only">기본 여행 조건</legend>
            <div>
              <h2>여행 날짜</h2>
              <p className="muted">
                축제 전후 2일 안, 최대 1박 2일 · 축제 개최일 포함
              </p>
            </div>
            <div className="date-grid">
              <label>
                시작일
                <input
                  type="date"
                  required
                  min={festival.dateSelection.min}
                  max={festival.dateSelection.max}
                  value={form.startDate}
                  onInput={(e) =>
                    update({
                      startDate: e.currentTarget.value,
                      endDate:
                        form.endDate < e.currentTarget.value
                          ? e.currentTarget.value
                          : form.endDate,
                    })
                  }
                  onChange={(e) =>
                    update({
                      startDate: e.target.value,
                      endDate:
                        form.endDate < e.target.value
                          ? e.target.value
                          : form.endDate,
                    })
                  }
                />
              </label>
              <label>
                종료일
                <input
                  type="date"
                  required
                  min={form.startDate || festival.dateSelection.min}
                  max={festival.dateSelection.max}
                  value={form.endDate}
                  onInput={(e) => update({ endDate: e.currentTarget.value })}
                  onChange={(e) => update({ endDate: e.target.value })}
                />
              </label>
            </div>
            <OriginPicker
              value={form.origin}
              onChange={(origin) => update({ origin })}
            />
            <div>
              <h2>교통수단</h2>
              <div className="chips mt-3">
                {(["CAR", "PUBLIC_TRANSIT"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="chip"
                    aria-pressed={form.transport === value}
                    onClick={() => update({ transport: value })}
                  >
                    {value === "CAR" ? "자가용" : "대중교통"}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>
          <button className="button" type="submit">
            취향과 필수 일정 선택
          </button>
        </form>
      )}
      {step === 1 && (
        <form className="trip-form" onSubmit={check}>
          <fieldset className="filter-panel" disabled={busy}>
            <legend className="sr-only">취향과 필수 일정</legend>
            <div className="date-grid">
              <label>
                여행 인원
                <input
                  type="number"
                  required
                  min={1}
                  max={20}
                  step={1}
                  value={Number.isNaN(form.travelers) ? "" : form.travelers}
                  onChange={(e) =>
                    update({
                      travelers:
                        e.target.value === "" ? NaN : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                총예산 · 원
                <input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="선택 · 비우면 미입력"
                  value={form.budgetKrw}
                  onChange={(e) => update({ budgetKrw: e.target.value })}
                />
              </label>
            </div>
            <div>
              <h2>관심사</h2>
              <div className="chips mt-3">
                {(
                  Object.keys(interestLabels) as (keyof typeof interestLabels)[]
                ).map((value) => (
                  <button
                    type="button"
                    key={value}
                    className="chip"
                    aria-pressed={form.interests.includes(value)}
                    onClick={() =>
                      update({
                        interests: form.interests.includes(value)
                          ? form.interests.filter((x) => x !== value)
                          : [...form.interests, value],
                      })
                    }
                  >
                    {interestLabels[value]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2>여행 스타일</h2>
              <div className="chips mt-3">
                {(["RELAXED", "PACKED"] as const).map((value) => (
                  <button
                    type="button"
                    className="chip"
                    key={value}
                    aria-pressed={form.style === value}
                    onClick={() => update({ style: value })}
                  >
                    {value === "RELAXED" ? "여유롭게" : "알차게"}
                  </button>
                ))}
              </div>
            </div>
            {overnight && (
              <label>
                숙박 선호
                <select
                  value={form.lodgingPreference ?? "ANY"}
                  onChange={(e) =>
                    update({
                      lodgingPreference: e.target
                        .value as TripForm["lodgingPreference"],
                    })
                  }
                >
                  {Object.entries(lodgingLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <PlacePicker
              festivalId={festival.id}
              selected={places}
              onChange={(value) => {
                setPlaces(value);
                update({ requiredPlaceIds: value.map((p) => p.id) });
              }}
            />
            <section>
              <h2>
                꼭 볼 프로그램 <span className="muted">선택 · 최대 10개</span>
              </h2>
              {programs.loading ? (
                <p role="status" className="muted mt-2">
                  프로그램을 확인하고 있어요.
                </p>
              ) : programs.error ? (
                <>
                  <p role="alert" className="field-error">
                    프로그램을 불러오지 못했어요. 선택 없이 진행할 수 있어요.
                  </p>
                  <button
                    type="button"
                    className="text-link"
                    onClick={programs.retry}
                  >
                    다시 불러오기
                  </button>
                </>
              ) : programs.data?.data.length === 0 ? (
                <p className="muted mt-2">등록된 세부 프로그램이 없어요.</p>
              ) : (
                programs.data?.data.map((p) => {
                  const available = pickableProgram(p, form),
                    selected = form.requiredProgramIds.includes(p.id);
                  return (
                    <label className="trip-check" key={p.id}>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={
                          !available ||
                          (!selected && form.requiredProgramIds.length >= 10)
                        }
                        onChange={() =>
                          update({
                            requiredProgramIds: selected
                              ? form.requiredProgramIds.filter(
                                  (id) => id !== p.id,
                                )
                              : [...form.requiredProgramIds, p.id],
                          })
                        }
                      />
                      <span>
                        {p.name}
                        <small>
                          {available
                            ? formatTime(p.startAt)
                            : "시간 미확인 또는 여행 날짜 외 · 선택 불가"}
                        </small>
                      </span>
                    </label>
                  );
                })
              )}
            </section>
            <label>
              추가 요청 · 선택
              <textarea
                maxLength={1000}
                rows={3}
                value={form.additionalRequests ?? ""}
                placeholder="예: 아이와 함께 걷기 편한 곳을 원해요"
                onChange={(e) => update({ additionalRequests: e.target.value })}
              />
            </label>
            <p className="muted">
              추가 요청은 저장되지만 모든 요청이 자동 반영되지는 않아요. 결과의
              추천 이유와 안내를 확인해 주세요.
            </p>
          </fieldset>
          <div className="flex gap-2">
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => {
                setError("");
                setStep(0);
              }}
            >
              이전
            </button>
            <button type="submit" className="button" disabled={busy}>
              {busy ? "조건 확인 중…" : "입력 조건 확인"}
            </button>
          </div>
        </form>
      )}
      {step === 2 && checked && (
        <div className="trip-form">
          <section className="info-card">
            <h2>나의 여행 조건</h2>
            <dl className="trip-summary">
              <dt>축제</dt>
              <dd>{festival.name}</dd>
              <dt>날짜</dt>
              <dd>
                {form.startDate} ~ {form.endDate}
                <br />
                {checked.nights === 0
                  ? "당일"
                  : `${checked.nights}박 ${checked.days}일`}
              </dd>
              <dt>출발지</dt>
              <dd>{form.origin?.label}</dd>
              <dt>교통·인원</dt>
              <dd>
                {form.transport === "CAR" ? "자가용" : "대중교통"} ·{" "}
                {form.travelers}명
              </dd>
              <dt>총예산</dt>
              <dd>
                {form.budgetKrw === ""
                  ? "미입력"
                  : `${Number(form.budgetKrw).toLocaleString("ko-KR")}원`}
              </dd>
              <dt>취향</dt>
              <dd>
                {form.interests.map((v) => interestLabels[v]).join(" · ") ||
                  "선택 안 함"}
              </dd>
              <dt>여행 스타일</dt>
              <dd>{form.style === "RELAXED" ? "여유롭게" : "알차게"}</dd>
              {overnight && (
                <>
                  <dt>숙박</dt>
                  <dd>{lodgingLabels[form.lodgingPreference ?? "ANY"]}</dd>
                </>
              )}
              <dt>필수 장소</dt>
              <dd>{places.map((p) => p.name).join(", ") || "선택 안 함"}</dd>
              <dt>필수 프로그램</dt>
              <dd>
                {form.requiredProgramIds
                  .map(
                    (id) =>
                      programs.data?.data.find((p) => p.id === id)?.name ?? id,
                  )
                  .join(", ") || "선택 안 함"}
              </dd>
              {form.additionalRequests && (
                <>
                  <dt>추가 요청</dt>
                  <dd>{form.additionalRequests}</dd>
                </>
              )}
            </dl>
          </section>
          {checked.warnings.map((w) => (
            <Notice key={w.code}>{w.message}</Notice>
          ))}
          <Notice>
            주변 장소와 여행 조건을 검토해 계획을 만들어요. AI 추천·이동 경로를
            확인할 수 없는 항목은 결과에서 따로 안내하며, 생성된 계획은 내
            계정에 저장됩니다.
          </Notice>
          <div className="flex gap-2">
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => setStep(1)}
            >
              조건 수정
            </button>
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={create}
            >
              {busy ? "요청 중…" : "이 조건으로 여행 계획 만들기"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
function errorText(error: unknown) {
  if (error instanceof ApiError) {
    const fields = error.fields
      ?.map((f) => `${f.path}: ${f.reason}`)
      .join(", ");
    return error.message + (fields ? ` (${fields})` : "");
  }
  return error instanceof Error
    ? error.message
    : "요청하지 못했어요. 다시 시도해 주세요.";
}
export function formatTime(value: string | null) {
  if (!value) return "시간 미정";
  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
