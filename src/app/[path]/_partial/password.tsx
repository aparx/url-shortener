"use client";
import { PassField, PassFieldRef } from "@/components";
import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { MdLock, MdPassword } from "react-icons/md";
import { visitWithPassword } from "../actions";
import { useRouter } from "next/navigation";

export function PasswordPage({ path }: { path: string }) {
  const [state, submit] = useFormState(visitWithPassword, undefined);
  const fieldRef = useRef<PassFieldRef>(null);
  const router = useRouter();

  useEffect(() => {
    // Automatically focus password field on mount
    fieldRef?.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-4 border-neutral-800 bg-black p-4 border rounded-lg">
      <h3 className="flex items-center gap-2 font-semibold text-lg">
        <MdLock />
        This link is protected by a password
      </h3>
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
        <div className="flex gap-[inherit] w-full">
          <button
            type="button"
            className="flex-1 border-neutral-800 bg-neutral-950 px-4 py-2 border rounded text-neutral-400"
            onClick={() => router.back()}
          >
            Go Back
          </button>
          <button className="flex-1 border-white bg-neutral-300 px-4 py-2 border rounded font-semibold text-black">
            Proceed
          </button>
        </div>
      </form>
    </div>
  );
}
