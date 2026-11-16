"use client";
import { useCallback, useState, type FormEvent } from "react";
import { accountApi, type UserSettings } from "@/lib/api/account";
import { useResource } from "@/lib/use-resource";
import { ApiError } from "@/lib/api/client";
import { RequireAuth } from "./require-auth";
import { useAuth } from "./auth-provider";
import { Loading, ErrorState, Notice } from "./ui";
export function TravelSettings() {
  return (
    <RequireAuth>
      <TravelContent />
    </RequireAuth>
  );
}
function TravelContent() {
  const result = useResource(
    useCallback((signal: AbortSignal) => accountApi.settings(signal), []),
  );
  if (result.loading) return <Loading />;
  if (result.error)
    return <ErrorState message={result.error.message} retry={result.retry} />;
  return (
    <TravelForm
      key={result.data!.data.version}
      initial={result.data!.data}
      reload={result.retry}
    />
  );
}
function TravelForm({
  initial,
  reload,
}: {
  initial: UserSettings;
  reload: () => void;
}) {
  const { session } = useAuth();
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [conflict, setConflict] = useState(false);
  const defaults = value.travelDefaults;
  function update<K extends keyof UserSettings["travelDefaults"]>(
    key: K,
    next: UserSettings["travelDefaults"][K],
  ) {
    setValue((old) => ({
      ...old,
      travelDefaults: { ...old.travelDefaults, [key]: next },
    }));
    setMessage("");
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (
      defaults.travelers !== null &&
      (!Number.isInteger(defaults.travelers) ||
        defaults.travelers < 1 ||
        defaults.travelers > 20)
    ) {
      setFailed(true);
      setMessage("인원은 1~20명으로 입력해 주세요.");
      return;
    }
    setBusy(true);
    setMessage("");
    setConflict(false);
    try {
      const response = await accountApi.saveSettings(
        value,
        session?.csrfToken ?? null,
      );
      setValue(response.data);
      setFailed(false);
      setMessage("여행 기본 설정을 저장했어요.");
    } catch (e) {
      setFailed(true);
      setConflict(e instanceof ApiError && e.status === 409);
      setMessage(
        e instanceof ApiError && e.status === 409
          ? "다른 곳에서 설정이 변경됐어요. 최신 설정을 불러온 뒤 다시 수정해 주세요."
          : e instanceof Error
            ? e.message
            : "저장하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1 className="page-title settings-subtitle">
        매번 입력하지 않아도 돼요
      </h1>
      <Notice>
        변경한 기본 설정은 기존에 저장된 여행 계획에 영향을 주지 않아요.
      </Notice>
      <form onSubmit={save} className="travel-form">
        <fieldset className="filter-panel" disabled={busy}>
          <legend className="sr-only">여행 기본 조건</legend>
          <div>
            <h2>기본 출발지</h2>
            <p className="muted mt-2">
              {defaults.origin?.label ?? "저장된 출발지가 없어요."}
            </p>
            <p className="muted mt-2">
              출발지 검색과 변경은 여행 조건 입력 기능에서 제공할 예정이에요.
            </p>
          </div>
          <label>
            교통수단
            <select
              value={defaults.transport ?? ""}
              onChange={(e) =>
                update(
                  "transport",
                  (e.target.value || null) as typeof defaults.transport,
                )
              }
            >
              <option value="">선택 안 함</option>
              <option value="CAR">자가용</option>
              <option value="PUBLIC_TRANSIT">대중교통</option>
            </select>
          </label>
          <label>
            여행 인원
            <input
              type="number"
              min={1}
              max={20}
              step={1}
              placeholder="선택 안 함"
              value={defaults.travelers ?? ""}
              onChange={(e) =>
                update(
                  "travelers",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </label>
          <div>
            <h2>여행 취향</h2>
            <div className="chips mt-3">
              {(
                [
                  { value: "FOOD", label: "먹거리" },
                  { value: "CAFE", label: "카페" },
                  { value: "NATURE", label: "자연" },
                  { value: "EXPERIENCE", label: "체험" },
                  { value: "CULTURE", label: "문화" },
                  { value: "SHOPPING", label: "쇼핑" },
                ] as const
              ).map((item) => (
                <button
                  type="button"
                  key={item.value}
                  className="chip"
                  aria-pressed={defaults.interests.includes(item.value)}
                  onClick={() =>
                    update(
                      "interests",
                      defaults.interests.includes(item.value)
                        ? defaults.interests.filter((v) => v !== item.value)
                        : [...defaults.interests, item.value],
                    )
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <label>
            여행 스타일
            <select
              value={defaults.style ?? ""}
              onChange={(e) =>
                update(
                  "style",
                  (e.target.value || null) as typeof defaults.style,
                )
              }
            >
              <option value="">선택 안 함</option>
              <option value="RELAXED">여유롭게</option>
              <option value="PACKED">알차게</option>
            </select>
          </label>
          <label>
            숙소 선호
            <select
              value={defaults.lodgingPreference ?? ""}
              onChange={(e) =>
                update(
                  "lodgingPreference",
                  (e.target.value || null) as typeof defaults.lodgingPreference,
                )
              }
            >
              <option value="">선택 안 함</option>
              <option value="ANY">상관없음</option>
              <option value="HOTEL">호텔</option>
              <option value="PENSION">펜션</option>
              <option value="GUESTHOUSE">게스트하우스</option>
              <option value="SELF_ARRANGED">직접 준비</option>
            </select>
          </label>
          <label className="privacy-toggle">
            <input
              type="checkbox"
              checked={value.privacy.saveOrigin}
              onChange={(e) => {
                setValue((old) => ({
                  ...old,
                  privacy: { saveOrigin: e.target.checked },
                }));
                setMessage("");
              }}
            />
            <span>다음 여행을 위해 기본 출발지 저장 허용</span>
          </label>
          <p className="muted">
            허용을 끄고 저장하면 기존 기본 출발지가 삭제돼요. 이전 여행 계획은
            유지됩니다.
          </p>
        </fieldset>
        {message && (
          <p
            role={failed ? "alert" : "status"}
            className={failed ? "field-error" : "account-feedback"}
          >
            {message}
          </p>
        )}
        {conflict && (
          <button type="button" className="button secondary" onClick={reload}>
            최신 설정 불러오기
          </button>
        )}
        <button type="submit" className="button" disabled={busy || conflict}>
          {busy ? "저장 중…" : "기본 설정 저장"}
        </button>
      </form>
    </>
  );
}
