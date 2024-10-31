"use client";
import {
  Button,
  createTabGroupPanelId,
  createTabGroupTabId,
} from "@/components";
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
  onStateChange?: (state: ShortenUrlFormState["state"]) => void;
}

export function ShortenUrlForm({
  tabs,
  tabIndex,
  className,
  onStateChange,
  ...restProps
}: ShortenUrlFormProps) {
  const [state, submit] = useFormState(shortenUrl, undefined);

  useEffect(() => {
    onStateChange?.(state);
  }, [state]);

  return (
    <form
      action={submit}
      className={twMerge("overflow-hidden", className)}
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
      <div className="flex gap-3 mt-3">
        <Button className="flex-1" color="cta">
          Shorten URL
          <GrLinkNext className="sm:block hidden" />
        </Button>
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
      className="flex-shrink-0 space-y-3 w-full"
    >
      {children}
    </div>
  );
}
