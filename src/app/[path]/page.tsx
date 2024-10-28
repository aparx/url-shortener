import { urlVisitService } from "@/services/config";
import { redirect } from "next/navigation";
import { ExpiredPage } from "./_partial/expired";
import { NotFoundPage } from "./_partial/notFound";
import { PasswordPage } from "./_partial/password";

export default async function Page({
  params,
  searchParams,
}: {
  params: { path: string };
  searchParams: { password?: string };
}) {
  const result = await urlVisitService.attemptVisit(
    params.path,
    searchParams.password,
  );
  if (result?.state !== "error") return redirect(result.endpoint);
  switch (result.code) {
    case "not-found":
      return <NotFoundPage path={params.path} />;
    case "expired":
      return <ExpiredPage path={params.path} />;
    case "wrong-password":
      return <PasswordPage path={params.path} />;
    default:
      throw new Error("An unknown error occurred");
  }
}
