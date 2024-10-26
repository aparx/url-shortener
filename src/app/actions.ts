"use server";
import { createRedirectDataSchema, UrlService } from "@/services/urlService";

export async function createUrl(prevState: any, formData: FormData) {
  const obj = createRedirectDataSchema.safeParse({
    endpoint: formData.get("endpoint"),
    password: formData.get("password"),
    once: Boolean(formData.get("once")),
    expireIn: formData.has("expireIn")
      ? Number(formData.get("expireIn"))
      : undefined,
  });

  if (obj.error)
    return { state: "error", error: obj.error.flatten().fieldErrors };

  return UrlService.createUrl(obj.data).then(
    (path) => ({ state: "success", path }),
    (rejectReason) => ({ state: "error", error: { general: rejectReason } }),
  );
}
