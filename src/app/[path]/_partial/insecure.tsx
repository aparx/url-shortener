"use client";
import { Button } from "@/components";
import { PageContainer } from "@/components/pageContainer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GrLinkNext, GrLinkPrevious } from "react-icons/gr";
import { MdWarning } from "react-icons/md";

export function InsecurePage({ endpoint }: { endpoint: string }) {
  const router = useRouter();

  return (
    <PageContainer.Root className="max-w-[min(400px,100vw-2rem)]">
      <PageContainer.Title>
        This link is potentially harmful
      </PageContainer.Title>
      <div className="space-y-3">
        <div className="[&::-webkit-scrollbar]:hidden p-2 border border-red-800 rounded max-w-full text-neutral-300 overflow-x-auto">
          {endpoint}
        </div>
        <section className="space-y-2 bg-red-950 p-3 border border-red-800 rounded text-red-300 text-sm">
          <div className="flex items-center gap-2">
            <MdWarning />
            <h3 className="font-semibold">Warning: Fraud, Malware or worse</h3>
          </div>
          <div>
            The endpoint might include scams, malware, phishing, fraud or other
            harmful content. They might try to get you to download their harmful
            software, or retrieve and abuse sensitive information, such as your
            credit card, address, phone number, etc.
          </div>
        </section>
        <div className="flex flex-wrap gap-3">
          <Button color="cta" className="flex-1" onClick={() => router.back()}>
            <GrLinkPrevious />
            Go back
          </Button>
          <Button asChild className="flex-1">
            <Link href={endpoint}>
              Visit anyways
              <GrLinkNext />
            </Link>
          </Button>
        </div>
      </div>
    </PageContainer.Root>
  );
}
