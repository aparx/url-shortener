"use server";

import {
  shortenUrlInputDataSchema,
  UrlCoreService,
  DefaultUrlCoreService,
} from "@/services/url";

export async function createUrl(_: any, formData: FormData) {
  return createUrlWithService(formData, DefaultUrlCoreService.default());
}

function createUrlWithService(formData: FormData, service: UrlCoreService) {
  const obj = shortenUrlInputDataSchema.safeParse({
    endpoint: formData.get("endpoint"),
    password: formData.get("password"),
    once: Boolean(formData.get("once")),
    expireIn: formData.has("expireIn")
      ? Number(formData.get("expireIn"))
      : undefined,
  });

  if (obj.error)
    return { state: "error", error: obj.error.flatten().fieldErrors };

  return service
    .shortenUrl(obj.data)
    .then((path) => ({ state: "success", path }));
}
