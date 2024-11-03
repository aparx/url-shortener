import { urlVisitService } from "@/services/config";
import { ErrorPage } from "./_partial/error";
import { PasswordPage } from "./_partial/password";
import { RedirectWarning } from "./_partial/content";

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
  if (result?.state !== "error") {
    return <RedirectWarning endpoint={result.endpoint} />;
  }
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
