"use client";
import { CheckField, PassField, TabGroup, TextField } from "@/components";
import { useEncodedSearchParam } from "@/hooks/useEncodedSearchParam";
import React, { memo, useMemo, useState } from "react";
import { MdLink, MdPassword, MdTag } from "react-icons/md";
import { PageContainer } from "../components/pageContainer";
import {
  ShortenUrlForm,
  ShortenUrlFormState,
  ShortenUrlFormTab,
} from "./_components/shortenUrlForm";
import {
  shortenedModalDataSchema,
  ShortenedUrlModal,
} from "./_partials/shortenedUrlModal";

const tabs: Readonly<ShortenUrlFormTab[]> = Object.freeze([
  { name: "Essential", page: memo(EssentialPage) },
  { name: "Security", page: memo(SecurityPage) },
  { name: "Expiration", page: memo(ExpirationPage) },
]);

export default function Home({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    // Base64 encoded string, containing the data required
    created?: string;
  }>;
}) {
  const searchParams = React.use(searchParamsPromise);

  const [tabIndex, setTabIndex] = useState<number>(0);
  const createModalParam = useEncodedSearchParam(
    "created",
    shortenedModalDataSchema.parse,
  );

  const modalData = useMemo(
    () => createModalParam.resolve(new URLSearchParams(searchParams)),
    [createModalParam, searchParams],
  );

  return (
    <PageContainer.Root className="max-w-[min(375px,calc(100vw-1rem))]">
      <TabGroup
        className="mx-auto"
        tabs={tabs.map((x) => x.name)}
        onTabUpdate={setTabIndex}
        defaultTab={0}
      />
      <ShortenUrlForm
        tabIndex={tabIndex}
        tabs={tabs}
        onStateChange={(state) => {
          if (state?.state !== "success") return;
          if (!state.fields?.endpoint) throw new Error("Missing endpoint");
          const url = new URL(state.fields.endpoint);
          console.log("=========================================");
          console.log("push_url", state.data);
          createModalParam.push({
            ...state.data,
            endpointHostname: url.hostname,
            endpointProtocol: url.protocol,
            hasPassword: !!state.fields?.password?.trim(),
            hasExpiration: !!state.fields?.expireIn,
            hasOnce: !!state.fields?.once,
          });
        }}
      />
      {modalData && (
        <ShortenedUrlModal
          {...modalData}
          onOpenChange={(v) => !v && createModalParam.remove()}
        />
      )}
    </PageContainer.Root>
  );
}

function EssentialPage({ state }: ShortenUrlFormState) {
  const status = state?.state;
  const fields = state?.fields;

  return (
    <>
      <TextField
        name="endpoint"
        label="Endpoint URL"
        placeholder="https://aparx.dev"
        leading={<MdLink size="1.25em" className="text-neutral-600" />}
        error={state?.state === "error" ? state.error.endpoint : undefined}
        defaultValue={(status === "error" && fields?.endpoint) || undefined}
        required
      />
      <TextField
        name="path"
        label="Slug (optional)"
        placeholder="hello-world"
        leading={<MdTag size="1.25em" className="text-neutral-600" />}
        error={status === "error" ? state?.error.path : undefined}
        defaultValue={(status === "error" && fields?.path) || undefined}
        maxLength={32}
        pattern={/^[a-zA-Z0-9_-]$/.source}
        onChange={(e) => {
          e.target.value = e.target.value
            .trimStart()
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9_-]/g, "");
        }}
      />
    </>
  );
}

function SecurityPage({ state }: ShortenUrlFormState) {
  const status = state?.state;
  const fields = state?.fields;

  return (
    <>
      <PassField
        name="password"
        label="Password (optional)"
        placeholder="Password"
        leading={<MdPassword size="1.25em" className="text-neutral-600" />}
        error={state?.state === "error" ? state.error.password : undefined}
        defaultValue={(status === "error" && fields?.password) || undefined}
      />
      <CheckField label="One-Time use only" name="once" />
    </>
  );
}

const expirationItems: ReadonlyArray<{
  mins?: number | undefined;
  text: string;
}> = [
  { text: "Never" },
  { mins: 30, text: "30 mins" },
  { mins: 60, text: "1 hour" },
  { mins: 6 * 60, text: "6 hours" },
  { mins: 24 * 60, text: "1 day" },
  { mins: 3 * 24 * 60, text: "3 days" },
  { mins: 7 * 24 * 60, text: "7 days" },
  { mins: 30 * 24 * 60, text: "1 month" },
  { mins: 3 * 30 * 24 * 60, text: "3 months" },
] as const;

function ExpirationPage({ state }: ShortenUrlFormState) {
  return (
    <fieldset className="gap-2 border-neutral-800 grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] p-1 border rounded-lg h-full max-h-52 overflow-y-auto">
      {expirationItems.map((item) => (
        <label
          key={item.text}
          className="flex items-center gap-2 border-neutral-700 hover:border-neutral-600 [&:has(input:checked)]:bg-neutral-300 hover:bg-neutral-950 focus-within:bg-neutral-950 px-2 py-1 rounded [&:has(input:checked)]:font-semibold text-neutral-400 [&:has(input:checked)]:text-neutral-950 transition-all cursor-pointer"
        >
          <input
            type="radio"
            name="expireIn"
            value={item.mins}
            aria-label={item.text}
            className="peer sr-only"
            defaultChecked={
              state?.state === "error" && state?.fields?.expireIn
                ? state.fields.expireIn === item.mins
                : !item.mins
            }
          />
          <span className="relative peer-checked:after:absolute peer-checked:after:inset-0.5 border-neutral-600 peer-checked:border-sky-950 peer-checked:after:bg-sky-950 border rounded-full peer-checked:after:rounded-full w-3 h-3 transition-colors after:transition-colors" />
          {item.text}
        </label>
      ))}
    </fieldset>
  );
}
