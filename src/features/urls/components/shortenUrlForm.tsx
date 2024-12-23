"use client";
import {
  Button,
  createTabGroupPanelId,
  createTabGroupTabId,
} from "@/components";
import React, {
  ComponentPropsWithoutRef,
  useActionState,
  useEffect,
  useRef,
} from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { GrLinkNext } from "react-icons/gr";
import { ImSpinner7 } from "react-icons/im";
import { twMerge } from "tailwind-merge";
import { shortenUrl } from "../server/actions/shortenUrl";

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
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [state, submit, isPending] = useActionState(handleForm, undefined);

  // Fire state event changes
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  useEffect(() => {
    onStateChangeRef.current?.(state);
  }, [state]);

  async function handleForm(prevState: unknown, formData: FormData) {
    if (!executeRecaptcha) throw new Error("Recaptcha is not yet available");
    formData.set("recaptchaToken", await executeRecaptcha("submit"));
    return shortenUrl(prevState, formData);
  }

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
      <div className="flex gap-3 mt-5">
        <Button className="flex-1" color="cta" disabled={isPending}>
          Shorten URL
          {isPending ? (
            <ImSpinner7 className="animate-spin" />
          ) : (
            <GrLinkNext className="sm:block hidden" />
          )}
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

  // TODO classes flex-shrink-0 and space-y-5 are not generated at build-time?
  return (
    <div
      id={createTabGroupPanelId(name)}
      ref={ref}
      aria-hidden={!active}
      aria-labelledby={createTabGroupTabId(name)}
      className="flex-shrink-0 space-y-5 w-full"
    >
      {children}
    </div>
  );
}
