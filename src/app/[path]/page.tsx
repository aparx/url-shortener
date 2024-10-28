import { urlVisitService } from "@/services/config";
import { redirect } from "next/navigation";
import { ErrorPage } from "./_partial/error";
import { PasswordPage } from "./_partial/password";

export const dynamic = "force-dynamic";

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
      return <ErrorPage>Link not found</ErrorPage>;
    case "expired":
      return <ErrorPage>This link is expired</ErrorPage>;
    case "wrong-password":
      return <PasswordPage path={params.path} />;
    default:
      throw new Error("An unknown error occurred");
  }
}
