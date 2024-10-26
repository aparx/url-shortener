"use server";

import {
  createRedirectDataSchema,
  DefaultUrlService as defaultUrlService,
  UrlMutationService,
} from "@/services/url";

export async function createUrl(_: any, formData: FormData) {
  return createUrlWithService(formData, defaultUrlService);
}

function createUrlWithService(formData: FormData, service: UrlMutationService) {
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

  return service
    .createUrl(obj.data)
    .then((path) => ({ state: "success", path }));
}
