import Link from "next/link";
import { Notice } from "./ui";
export function Placeholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <p className="eyebrow mb-3">준비 중</p>
      <h1 className="page-title">{title}</h1>
      <Notice>{description}</Notice>
      <Link href="/festivals" className="text-link mt-4">
        충남 축제 먼저 둘러보기 ↗
      </Link>
    </>
  );
}
