import { BoardPost } from "@/components/travel-board";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BoardPost id={id} />;
}
