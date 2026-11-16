import { Suspense } from "react";
import { LoginView } from "@/components/login-view";
import { Loading } from "@/components/ui";
export const metadata = { title: "로그인" };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginView />
    </Suspense>
  );
}
