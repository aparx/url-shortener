"use client";
import { Button, PassField, PassFieldRef } from "@/components";
import { PageContainer } from "@/components/pageContainer";
import { visitWithPassword } from "@/features/urls/server/actions/visitUrl";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { GrLinkNext } from "react-icons/gr";
import { ImSpinner7 } from "react-icons/im";
import { MdLock, MdPassword } from "react-icons/md";

export function PasswordPage({ path }: { path: string }) {
  const [state, submit, isPending] = useActionState(
    visitWithPassword,
    undefined,
  );
  const fieldRef = useRef<PassFieldRef>(null);
  const router = useRouter();

  useEffect(() => {
    // Automatically focus password field on mount
    fieldRef?.current?.focus();
  }, []);

  return (
    <PageContainer.Root>
      <PageContainer.Title>
        <MdLock />
        This link is protected by a password
      </PageContainer.Title>
      <form action={submit} className="flex flex-col gap-3">
        <input type="hidden" name="path" value={path} />
        <PassField
          ref={fieldRef}
          name="password"
          placeholder="Enter password to continue"
          leading={<MdPassword size="1.25em" />}
          error={
            state?.code === "wrong-password" ? "Wrong password" : undefined
          }
          required
        />
        <div className="flex gap-3 w-full">
          <Button
            type="button"
            className="flex-1"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Go Back
          </Button>
          <Button className="flex-1" color="cta" disabled={isPending}>
            Proceed
            {isPending ? (
              <ImSpinner7 className="animate-spin" />
            ) : (
              <GrLinkNext className="sm:block hidden" />
            )}
          </Button>
        </div>
      </form>
    </PageContainer.Root>
  );
}
