"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { urlVisitService } from "../service/config";
import { UrlVisitService } from "../service/urlVisitService";

const visitWithPasswordInputSchema = z.object({
  path: z.string(),
  password: z.string(),
});

export async function visitWithPassword(_: unknown, formData: FormData) {
  return visitWithPasswordAndService(formData, urlVisitService);
}

async function visitWithPasswordAndService(
  formData: FormData,
  visitService: UrlVisitService,
) {
  const { path, password } = visitWithPasswordInputSchema.parse({
    path: formData.get("path"),
    password: formData.get("password"),
  });
  const result = await visitService.attemptVisit(path, password);
  if (result.state === "success") redirect(result.endpoint);
  return result;
}
