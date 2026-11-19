import { GenerationProgress } from "@/components/generation-progress";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GenerationProgress id={id} />;
}
