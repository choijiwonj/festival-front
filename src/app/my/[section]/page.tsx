import { notFound } from "next/navigation";
import {
  DemoPlanList,
  DemoBoard,
  DemoProfile,
  DemoSettings,
} from "@/components/demo-views";
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (section === "plans") return <DemoPlanList />;
  if (section === "reviews") return <DemoBoard mine />;
  if (section === "profile") return <DemoProfile />;
  if (section === "settings") return <DemoSettings />;
  notFound();
}
