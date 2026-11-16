import { FestivalDetailView } from "@/components/festival-detail";
export const metadata = { title: "축제 상세" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FestivalDetailView id={id} />;
}
