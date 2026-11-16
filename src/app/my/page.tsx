import { MyDashboard } from "@/components/my-dashboard";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ login?: string }>;
}) {
  const params = await searchParams;
  return <MyDashboard loginFailed={params.login === "failed"} />;
}
