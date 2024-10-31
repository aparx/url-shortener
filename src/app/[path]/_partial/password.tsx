"use client";
import { Button, PassField, PassFieldRef } from "@/components";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { GrLinkNext } from "react-icons/gr";
import { MdLock, MdPassword } from "react-icons/md";
import { visitWithPassword } from "../actions";

export function PasswordPage({ path }: { path: string }) {
  const [state, submit] = useFormState(visitWithPassword, undefined);
  const fieldRef = useRef<PassFieldRef>(null);
  const router = useRouter();

  useEffect(() => {
    // Automatically focus password field on mount
    fieldRef?.current?.focus();
  }, []);

  return (
    <div className="space-y-4 border-neutral-800 bg-black p-5 border rounded-lg">
      <h3 className="flex items-center gap-2 font-semibold text-lg">
        <MdLock />
        This link is protected by a password
      </h3>
      <form action={submit} className="space-y-3">
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
          >
            Go Back
          </Button>
          <Button className="flex-1" color="cta">
            Proceed
            <GrLinkNext className="sm:block hidden" />
          </Button>
        </div>
      </form>
    </div>
  );
}
