import { z } from "zod";

export type CreateRedirectData = z.infer<typeof createRedirectDataSchema>;

export const createRedirectDataSchema = z.object({
  endpoint: z.string().url().max(2048),
  password: z.string().max(128).nullish().optional(),
  once: z.boolean().optional(),
  /** Expire in `x` minutes */
  expireIn: z.number().int().nullish().optional(),
});
