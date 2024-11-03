"use client";
import { Button } from "@/components";
import { useState } from "react";
import { PageContainer } from "../../_components/pageContainer";
import { ProtocolBadge } from "../../_components/protocolBadge";

export function RedirectWarning({ endpoint }: { endpoint: string }) {
  const url = new URL(endpoint);
  const [ticksLeft, setTicksLeft] = useState(5);

  return (
    <PageContainer.Root className="max-w-[min(375px,calc(100vw-1rem))]">
      <PageContainer.Title>You are about to be redirected</PageContainer.Title>
      <div className="flex items-center gap-2 border-neutral-800 bg-neutral-900 p-1 pr-2 border rounded-lg text-neutral-400">
        <ProtocolBadge.Badge
          protocol={url.protocol}
          render={(_, secure) => (secure ? "Secure" : "Not Secure")}
        />
        {url.origin}
      </div>
      <div className="text-neutral-400">
        This link is not associated with this shortener. Make sure this link is
        secure, before proceeding.
      </div>
      <Button color="cta">Redirect {ticksLeft}</Button>
    </PageContainer.Root>
  );
}
