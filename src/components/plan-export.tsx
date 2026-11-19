"use client";
import { useEffect, useRef, useState } from "react";
import { Download, FileText, Image as ImageIcon, LoaderCircle } from "lucide-react";
import { exportApi, exportDates, exportFile, exportOutcome, safeExportFilename, type ExportFormat, type ExportRecord } from "@/lib/api/exports";
import type { TripPlan } from "@/lib/trips";
import { useAuth } from "./auth-provider";

function delay(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const aborted = () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", aborted); resolve(); }, milliseconds);
    if (signal.aborted) aborted();
    else signal.addEventListener("abort", aborted, { once: true });
  });
}

export function PlanExport({ plan }: { plan: TripPlan }) {
  const { session } = useAuth();
  const [format, setFormat] = useState<ExportFormat>("PDF");
  const [dates, setDates] = useState(plan.days.map((day) => day.date));
  const [phase, setPhase] = useState<"idle" | "working" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [record, setRecord] = useState<ExportRecord | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [downloadStarted, setDownloadStarted] = useState(false);
  const pending = useRef(false);
  const operation = useRef<AbortController | null>(null);
  const request = useRef<{ signature: string; key: string; id?: string } | null>(null);
  const objectUrls = useRef(new Set<string>());
  const blocked = plan.status === "INFEASIBLE";
  const busy = phase === "working" || downloading;

  useEffect(() => {
    const urls = objectUrls.current;
    return () => { operation.current?.abort(); urls.forEach((url) => URL.revokeObjectURL(url)); urls.clear(); };
  }, []);

  function optionsChanged() {
    setPhase("idle"); setRecord(null); setMessage(""); setDownloadError(""); setDownloadStarted(false);
  }

  async function createOrResume() {
    if (pending.current || blocked) return;
    let selected: string[];
    try { selected = exportDates(plan.days.map((day) => day.date), dates); }
    catch (error) { setPhase("error"); setMessage((error as Error).message); return; }
    const signature = JSON.stringify([plan.id, plan.version, format, selected]);
    if (!request.current || request.current.signature !== signature)
      request.current = { signature, key: crypto.randomUUID() };
    const current = request.current;
    pending.current = true;
    const controller = new AbortController();
    operation.current?.abort(); operation.current = controller;
    setPhase("working"); setMessage(current.id ? "파일 생성 상태를 확인하고 있어요." : "다운로드할 파일을 요청하고 있어요.");
    setDownloadError(""); setDownloadStarted(false);
    try {
      if (!current.id) {
        const response = await exportApi.create(plan.id, plan.version, format, selected, session?.csrfToken ?? null, current.key,
          AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]));
        if (!response.data.exportId) throw new Error("파일 생성 작업을 확인하지 못했어요. 다시 시도해 주세요.");
        current.id = response.data.exportId;
      }
      const deadline = Date.now() + 90000;
      while (!controller.signal.aborted) {
        const response = await exportApi.status(current.id, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]));
        const item = response.data;
        const outcome = exportOutcome(item);
        if (outcome === "failed") {
          request.current = null;
          throw new Error(item.error?.message || "파일을 만들지 못했어요. 다시 시도해 주세요.");
        }
        if (outcome === "invalid") throw new Error("다운로드 정보를 확인하지 못했어요. 생성 상태를 다시 확인해 주세요.");
        if (outcome === "ready") { setRecord(item); setPhase("ready"); setMessage("파일이 준비됐어요. 아래 버튼으로 저장하세요."); return; }
        if (Date.now() >= deadline) throw new Error("파일 생성에 시간이 걸리고 있어요. 진행 상태를 다시 확인해 주세요.");
        setMessage("여행 일정과 비용을 파일에 담고 있어요. 잠시만 기다려 주세요.");
        const seconds = response.meta.pollAfterSeconds;
        await delay(Number.isFinite(seconds) ? Math.max(1, Math.min(5, seconds!)) * 1000 : 2000, controller.signal);
      }
    } catch (error) {
      if (!controller.signal.aborted) { setPhase("error"); setMessage(error instanceof Error ? error.message : "파일을 만들지 못했어요."); }
    } finally { pending.current = false; }
  }

  async function download() {
    if (!record || !record.contentType || pending.current) return;
    pending.current = true; setDownloading(true); setDownloadError(""); setDownloadStarted(false);
    const controller = new AbortController();
    operation.current?.abort(); operation.current = controller;
    try {
      const blob = await exportFile(record.id, record.contentType, AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]));
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob); objectUrls.current.add(url);
      const link = document.createElement("a");
      link.href = url; link.download = safeExportFilename(record.filename, record.contentType);
      document.body.append(link); link.click(); link.remove();
      setDownloadStarted(true);
      setTimeout(() => { URL.revokeObjectURL(url); objectUrls.current.delete(url); }, 1000);
    } catch (error) {
      if (!controller.signal.aborted) setDownloadError(error instanceof Error ? error.message : "파일을 저장하지 못했어요.");
    } finally { pending.current = false; if (!controller.signal.aborted) setDownloading(false); }
  }

  const fileLabel = record?.contentType === "application/zip" ? "ZIP" : format;
  return <section className="section info-card plan-export" aria-labelledby="export-title">
    <p className="eyebrow">가방 속에 담아 가는 여행</p>
    <h2 id="export-title" className="mt-1">여행 계획 다운로드</h2>
    <p className="muted mt-2">일정·이동시간·비용과 확인할 사항을 함께 저장해요.</p>
    {blocked && <p className="field-error mt-3">일정의 조건 충돌을 해결한 뒤 다운로드할 수 있어요.</p>}
    <fieldset className="export-options mt-4" disabled={busy || blocked}>
      <legend>파일 형식</legend>
      <div className="export-formats mt-2">
        {(["PDF", "PNG"] as const).map((value) => <label key={value} className={`export-format ${format === value ? "selected" : ""}`}>
          <input type="radio" name="export-format" value={value} checked={format === value} onChange={() => { setFormat(value); optionsChanged(); }} />
          {value === "PDF" ? <FileText size={20} aria-hidden="true" /> : <ImageIcon size={20} aria-hidden="true" />}
          <span><strong>{value === "PDF" ? "PDF 문서" : "PNG 이미지"}</strong><small>{value === "PDF" ? "한 파일로 보기" : "날짜별로 저장"}</small></span>
        </label>)}
      </div>
    </fieldset>
    <fieldset className="export-options mt-4" disabled={busy || blocked} aria-describedby="export-dates-help">
      <legend>저장할 날짜</legend>
      <div className="export-dates mt-2">
        {plan.days.map((day, index) => <label key={day.date}>
          <input type="checkbox" checked={dates.includes(day.date)} onChange={(event) => {
            setDates((old) => event.target.checked ? [...old, day.date] : old.filter((date) => date !== day.date)); optionsChanged();
          }} />
          <span>{index + 1}일차 · {day.date.replaceAll("-", ".")}</span>
        </label>)}
      </div>
      <p id="export-dates-help" className={`mt-2 ${dates.length ? "muted" : "field-error"}`}>{!dates.length ? "저장할 날짜를 하나 이상 선택해 주세요." : format === "PNG" && dates.length > 1 ? "여러 날짜의 이미지는 ZIP 파일로 묶어서 저장해요." : `선택한 ${dates.length}일의 일정이 포함돼요.`}</p>
      <p className="muted mt-2">파일의 비용 요약은 전체 여행 기준입니다.</p>
    </fieldset>
    {phase !== "ready" && <button type="button" className="button w-full mt-4" onClick={createOrResume} disabled={busy || blocked || !dates.length}>
      {phase === "working" ? <LoaderCircle size={18} className="export-spinner" aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
      {phase === "working" ? "파일 만드는 중…" : phase === "error" ? request.current?.id ? "진행 상태 다시 확인" : "다시 만들기" : "다운로드 파일 만들기"}
    </button>}
    {message && <p className={`mt-3 ${phase === "error" ? "field-error" : "muted"}`} role={phase === "error" ? "alert" : "status"}>{message}</p>}
    {phase === "ready" && record && <div className="mt-4">
      <p className="muted export-filename">{record.filename}</p>
      <button type="button" className="button w-full mt-2" disabled={downloading} onClick={download}>
        <Download size={18} aria-hidden="true" />{downloading ? "파일 받는 중…" : `${fileLabel} 다운로드`}
      </button>
    </div>}
    {downloadError && <div className="mt-3"><p role="alert" className="field-error">{downloadError}</p>
      <button type="button" className="text-link mt-2" disabled={busy} onClick={() => { request.current = null; setRecord(null); createOrResume(); }}>파일 다시 만들기</button>
    </div>}
    {downloadStarted && <p role="status" className="muted mt-3">다운로드를 시작했어요. 브라우저의 다운로드 목록에서 확인하세요.</p>}
  </section>;
}
