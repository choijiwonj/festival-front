import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { PrivateLibrary } from "@/components/private-library";
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (section === "profile") redirect("/my");
  if (section === "plans" || section === "reviews")
    return <PrivateLibrary kind={section} />;
  notFound();
}
