"use client";
import { CheckField, PassField, Tabs, TextField } from "@/components";
import { useState } from "react";
import { useFormState } from "react-dom";
import { GrLinkNext } from "react-icons/gr";
import { MdLink, MdPassword, MdTag } from "react-icons/md";
import { createUrl } from "./actions";

export default function Home() {
  const [state, submit] = useFormState(createUrl, undefined);
  const tabs = ["Essential", "Security", "Expiration"] as const;
  const [tabIndex, setTabIndex] = useState<number>(0);

  return (
    <section className="flex flex-col justify-center items-center gap-16 mx-auto min-h-screen font-[family-name:var(--font-primary)]">
      <div className="bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] -z-10 absolute inset-0 bg-transparent bg-[size:24px_24px] w-full h-full"></div>
      <h2 className="font-bold text-2xl text-white">
        Shorten an URL. Securely.
      </h2>

      <div className="flex flex-col flex-shrink gap-4 border-neutral-800 bg-black p-4 border rounded-lg max-w-[min(350px,100vw)]">
        <div className="border-neutral-800 mx-auto p-1 border rounded-lg w-full max-w-fit overflow-hidden overflow-x-auto list-none">
          <Tabs tabs={tabs} onTabUpdate={setTabIndex} defaultTab={0} />
        </div>
        <form action={submit} className="flex flex-col gap-4 overflow-hidden">
          <div
            className="flex gap-4"
            style={{
              transform: `translateX(calc(-${tabIndex * 100}% - ${tabIndex} * 1rem))`,
              transition: ".4s transform",
            }}
          >
            <FormPage>
              <TextField
                name="endpoint"
                label="Endpoint URL"
                placeholder="https://aparx.dev"
                leading={<MdLink size="1.25em" className="text-neutral-600" />}
                required
              />
              <TextField
                name="alias"
                label="Custom alias (optional)"
                placeholder="hello-world"
                leading={<MdTag size="1.25em" className="text-neutral-600" />}
              />
            </FormPage>
            <FormPage>
              <PassField
                name="password"
                label="Password (optional)"
                placeholder="Password"
                leading={
                  <MdPassword size="1.25em" className="text-neutral-600" />
                }
              />
              <CheckField label="One-Time use only" name="once" />
            </FormPage>
            <FormPage>
              <input
                type="number"
                placeholder="Expire in min"
                name="expireIn"
              />
            </FormPage>
          </div>
          <div className="flex gap-4">
            {JSON.stringify(state)}
            <button className="flex-1 border-neutral-800 bg-neutral-950 p-2 border rounded text-neutral-300">
              Reset
            </button>
            <button className="flex flex-1 justify-center items-center gap-2 bg-neutral-300 disabled:opacity-35 p-2 border rounded font-semibold text-black">
              Shorten URL
              <GrLinkNext className="sm:block hidden" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function FormPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-shrink-0 gap-3 w-full">{children}</div>
  );
}
