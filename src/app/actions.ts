"use server";
import { urlCoreService } from "@/services/config";
import {
  shortenUrlInputDataSchema,
  ShortenUrlResult,
  UrlCoreService,
} from "@/services/url";
import { LibsqlError } from "@libsql/client";
import { z } from "zod";

type InputSchema = z.infer<typeof shortenUrlInputDataSchema>;
type ErrorObject = Partial<Record<keyof InputSchema, string[] | undefined>>;
type ActionsShortenUrlResult = (
  | { state: "success"; data: ShortenUrlResult; error?: never }
  | { state: "error"; error: ErrorObject; data?: never }
) & {
  fields: Partial<InputSchema> | undefined;
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
  const obj = shortenUrlInputDataSchema.safeParse({
    endpoint: formData.get("endpoint"),
    password: formData.get("password"),
    once: Boolean(formData.get("once")),
    expireIn: isFinite(expireIn) ? expireIn : undefined,
    path: path?.trim()?.length ? path : undefined,
  });

  function createError(error: ErrorObject): ActionsShortenUrlResult {
    return { state: "error", error, fields: obj.data } as const;
  }

  if (obj.error) return createError(obj.error.flatten().fieldErrors);

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
