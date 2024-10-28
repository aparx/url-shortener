"use server";
import { urlVisitService } from "@/services/config";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function visitWithPassword(_: any, formData: FormData) {
  const { path, password } = z
    .object({ path: z.string().cuid2(), password: z.string().min(1) })
    .parse({ path: formData.get("path"), password: formData.get("password") });
  const result = await urlVisitService.attemptVisit(path, password);
  if (result.state === "success") redirect(result.endpoint);
  return result;
}
