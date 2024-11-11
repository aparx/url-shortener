import { z } from "zod";

export type ShortenUrlData = z.infer<typeof shortenUrlInputDataSchema>;

export const shortenUrlInputDataSchema = z.object({
  endpoint: z.string().url().max(2048),
  password: z.string().max(128).nullish().optional(),
  once: z.boolean().optional(),
  /** Expire in `x` minutes */
  expireIn: z.number().int().nullish().optional(),
  path: z
    .string()
    .regex(/^[A-Za-z0-9_-]{0,32}$/, "Must only contain alphanumerics, _ or -")
    .max(32)
    .optional(),
});
