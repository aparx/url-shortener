import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type UseCurrentUrlResult = (path?: string) => URL;

/**
 * React hook that returns a memoized function used to get the current URL.
 * The returned function has an optional parameter of type string, being the
 * pathname that can then optionally override the current pathname.
 * The returned function *always* returns a *new* URL instance.
 */
export function useCurrentUrl(): UseCurrentUrlResult {
  const searchParams = useSearchParams();
  const pathName = usePathname();
  return useCallback(
    (path: string = pathName) => {
      if (!process.env.NEXT_PUBLIC_URL)
        throw new Error("Missing NEXT_PUBLIC_URL in .env");
      const baseUrl = process.env.NEXT_PUBLIC_URL;
      if (searchParams.size === 0) return new URL(path, baseUrl);
      return new URL(`${path}?${searchParams.toString()}`, baseUrl);
    },
    [pathName, searchParams],
  );
}
