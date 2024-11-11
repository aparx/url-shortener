import { urlVisitService } from "@/features/urls/server/service/config";
import { redirect } from "next/navigation";
import { ErrorPage } from "./_partial/error";
import { InsecurePage } from "./_partial/insecure";
import { PasswordPage } from "./_partial/password";

export const dynamic = "force-dynamic";

export default async function Page({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ path: string }>;
  searchParams: Promise<{ password?: string }>;
}) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;
  const result = await urlVisitService.attemptVisit(
    params.path,
    searchParams.password,
  );
  if (result?.state !== "error" && result.secure)
    return redirect(result.endpoint);
  switch (result.code) {
    case "not-found":
      return <ErrorPage>Link not found</ErrorPage>;
    case "expired":
      return <ErrorPage>This link is expired</ErrorPage>;
    case "wrong-password":
      return <PasswordPage path={params.path} />;
    default:
      if (!result.endpoint) throw new Error("Unknown error: missing endpoint");
      return <InsecurePage endpoint={result.endpoint} />;
  }
}
