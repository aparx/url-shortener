"use server";
import { urlCoreService } from "@/services/config";
import {
  shortenUrlInputDataSchema,
  ShortenUrlResult,
  UrlCoreService,
} from "@/services/url";
import { LibsqlError } from "@libsql/client";
import { z } from "zod";

const fullShortenUrlInputSchema = shortenUrlInputDataSchema.extend({
  recaptchaToken: z.string(),
});
type FullInputSchema = z.infer<typeof fullShortenUrlInputSchema>;
type ErrorObject = Partial<Record<keyof FullInputSchema, string[] | undefined>>;
type ActionsShortenUrlResult = (
  | { state: "success"; data: ShortenUrlResult; error?: never }
  | { state: "error"; error: ErrorObject; data?: never }
) & {
  fields: Partial<FullInputSchema> | undefined;
};

export async function shortenUrl(_: unknown, formData: FormData) {
  return shortenUrlWithService(formData, urlCoreService);
}

async function shortenUrlWithService(
  formData: FormData,
  service: UrlCoreService,
): Promise<ActionsShortenUrlResult> {
  const expireIn = Number(formData.get("expireIn"));
  const path = formData.get("path")?.toString();
  const obj = fullShortenUrlInputSchema.safeParse({
    endpoint: formData.get("endpoint"),
    password: formData.get("password"),
    once: Boolean(formData.get("once")),
    expireIn: isFinite(expireIn) ? expireIn : undefined,
    path: path?.trim()?.length ? path : undefined,
    recaptchaToken: formData.get("recaptchaToken"),
  });

  function createError(error: ErrorObject): ActionsShortenUrlResult {
    return { state: "error", error, fields: obj.data } as const;
  }

  if (obj.error) return createError(obj.error.flatten().fieldErrors);

  const verified = await verifyCaptcha(obj.data.recaptchaToken);
  if (!verified) return createError({ recaptchaToken: ["Failed to verify"] });

  return service
    .shortenUrl(obj.data)
    .then((data) => ({ state: "success", fields: obj.data, data }) as const)
    .catch((error) => {
      if (error instanceof LibsqlError && error.message.includes("UNIQUE"))
        return createError({ path: ["Path must be unique"] });
      console.error("Uncaught error", error.code, error.message);
      return createError({ endpoint: ["Unknown error"] });
    });
}

async function verifyCaptcha(token: string) {
  if (!process.env.RECAPTCHA_SECRET_KEY)
    throw new Error("Missing .env: RECAPTCHA_SECRET_KEY");
  const url = new URL("https://www.google.com/recaptcha/api/siteverify");
  url.searchParams.set("secret", process.env.RECAPTCHA_SECRET_KEY!);
  url.searchParams.set("token", token);
  const response = await fetch(url.href, { method: "post" });
  const json = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(json));
  return Boolean(json.data.success);
}
