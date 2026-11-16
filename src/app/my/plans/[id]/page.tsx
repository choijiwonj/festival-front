import { SavedPlan } from "@/components/saved-plan";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SavedPlan id={id} />;
}
