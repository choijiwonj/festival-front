import { TripEntry } from "@/components/trip-entry";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ festivalId?: string }>;
}) {
  const { festivalId } = await searchParams;
  return <TripEntry festivalId={festivalId} />;
}
