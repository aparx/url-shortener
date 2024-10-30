"use client";
import { createTabGroupPanelId, createTabGroupTabId } from "@/components";
import React, { ComponentPropsWithoutRef, useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { GrLinkNext } from "react-icons/gr";
import { twMerge } from "tailwind-merge";
import { shortenUrl } from "../actions";

type Awaited<T> = T extends Promise<infer V> ? V : never;

type ShortenUrlFormBaseProps = Omit<ComponentPropsWithoutRef<"form">, "action">;

export interface ShortenUrlFormState {
  state?: Awaited<ReturnType<typeof shortenUrl>> | undefined;
  submit: (payload: FormData) => void;
}

export interface ShortenUrlFormTab {
  name: string;
  page: (props: ShortenUrlFormState) => React.ReactNode;
}

export interface ShortenUrlFormProps extends ShortenUrlFormBaseProps {
  tabs: ReadonlyArray<ShortenUrlFormTab>;
  /** The currently active tab index */
  tabIndex: number;
}

export function ShortenUrlForm({
  tabs,
  tabIndex,
  className,
  ...restProps
}: ShortenUrlFormProps) {
  const [state, submit] = useFormState(shortenUrl, undefined);

  return (
    <form
      action={submit}
      className={twMerge("flex flex-col gap-4 overflow-hidden", className)}
      {...restProps}
    >
      <div
        className="flex gap-4"
        style={{
          transform: `translateX(calc(-${tabIndex * 100}% - ${tabIndex} * 1rem))`,
          transition: ".4s transform",
        }}
      >
        {tabs.map(({ name, page: Page }, i) => (
          <TabPageContainer key={name} name={name} active={tabIndex === i}>
            <Page submit={submit} state={state} />
          </TabPageContainer>
        ))}
      </div>
      <div className="flex gap-4">
        <button
          type="button"
          className="flex-1 border-neutral-800 bg-neutral-950 p-2 border rounded text-neutral-300"
        >
          Reset
        </button>
        <button className="flex flex-1 justify-center items-center gap-2 bg-neutral-300 disabled:opacity-35 p-2 border rounded font-semibold text-black whitespace-nowrap">
          Shorten URL
          <GrLinkNext className="sm:block hidden" />
        </button>
      </div>
    </form>
  );
}

function TabPageContainer({
  name,
  children,
  active,
}: {
  name: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Disable tabbing of each possible supported inputs
    // TODO extend the query selector, if new form components are added
    const query = ref.current?.querySelectorAll("a, button, input");
    if (!active) query?.forEach((x) => x.setAttribute("tabIndex", "-1"));
    else query?.forEach((x) => x.removeAttribute("tabIndex"));
  }, [active]);

  return (
    <div
      id={createTabGroupPanelId(name)}
      ref={ref}
      aria-hidden={!active}
      aria-labelledby={createTabGroupTabId(name)}
      className="flex flex-col flex-shrink-0 gap-3 w-full"
    >
      {children}
    </div>
  );
}
