"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
export function FestivalSearch() {
  const [q, setQ] = useState("");
  const router = useRouter();
  function submit(e: FormEvent) {
    e.preventDefault();
    router.push(
      `/festivals${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`,
    );
  }
  return (
    <form role="search" onSubmit={submit} className="search-box">
      <label className="sr-only" htmlFor="home-search">
        축제명 또는 지역으로 검색
      </label>
      <input
        id="home-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="축제명 또는 지역으로 검색"
        maxLength={100}
      />
      <button type="submit" aria-label="축제 검색">
        <Search size={20} />
      </button>
    </form>
  );
}
