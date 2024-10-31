import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { URLSearchParams } from "url";
import { useCurrentUrl } from "./useCurrentUrl";

export interface UseEncodedSearchParam<TData> {
  push: (data: TData, pathname?: string) => void;
  resolve: (searchParams: URLSearchParams) => TData | undefined;
  remove: (pathname?: string) => boolean;
}

/**
 * React hook for managing base64-encoded URL search parameters.
 * This hook provides functionality to encode complex data and store it as a URL
 * search parameter, retrieve and decode it and remove (delete) the parameter.
 *
 * @param paramKey the search parameter key to store the data for
 * @param parse    function responsible for parsing incoming data
 */
export function useEncodedSearchParam<TData>(
  paramKey: string,
  parse: (value: unknown) => TData | undefined,
): UseEncodedSearchParam<TData> {
  const router = useRouter();
  const createCurrentUrl = useCurrentUrl();

  return useMemo(
    () => ({
      push: (data, baseUrl) => {
        const buffer = Buffer.from(JSON.stringify(data), "utf8");
        const component = encodeURIComponent(buffer.toString("base64"));
        const currentUrl = createCurrentUrl(baseUrl);
        currentUrl.searchParams.set(paramKey, component);
        router.push(currentUrl.href);
      },
      resolve: (searchParams) => {
        const encodedValue = searchParams.get(paramKey);
        if (!encodedValue) return undefined;
        const buffer = Buffer.from(decodeURIComponent(encodedValue), "base64");
        return parse(JSON.parse(buffer.toString("utf8")));
      },
      remove: (baseUrl) => {
        const currentUrl = createCurrentUrl(baseUrl);
        if (!currentUrl.searchParams.has(paramKey)) return false;
        currentUrl.searchParams.delete(paramKey);
        router.push(currentUrl.href);
        return true;
      },
    }),
    [router, createCurrentUrl],
  );
}
