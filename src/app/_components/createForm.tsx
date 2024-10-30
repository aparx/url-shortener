"use client";
import { useFormState } from "react-dom";
import { GrLinkNext } from "react-icons/gr";
import { createUrl } from "../actions";

type Awaited<T> = T extends Promise<infer V> ? V : never;
type CreateFormStateData = Awaited<ReturnType<typeof createUrl>>;

export interface CreateFormState {
  state?: CreateFormStateData | undefined;
  submit: (payload: FormData) => void;
}

export interface CreateFormTab {
  name: string;
  page: (props: CreateFormState) => React.ReactNode;
}

export interface CreateFormProps {
  tabs: CreateFormTab[];
  /** The currently active tab index */
  tabIndex: number;
}

export function CreateForm({ tabs, tabIndex }: CreateFormProps) {
  const [state, submit] = useFormState(createUrl, undefined);

  return (
    <form action={submit} className="flex flex-col gap-4 overflow-hidden">
      <div
        className="flex gap-4"
        style={{
          transform: `translateX(calc(-${tabIndex * 100}% - ${tabIndex} * 1rem))`,
          transition: ".4s transform",
        }}
      >
        {tabs.map(({ name, page: Page }) => (
          <div key={name} className="flex flex-col flex-shrink-0 gap-3 w-full">
            <Page submit={submit} state={state} />
          </div>
        ))}
      </div>
      <div className="flex gap-4">
        <button className="flex-1 border-neutral-800 bg-neutral-950 p-2 border rounded text-neutral-300">
          Reset
        </button>
        <button className="flex flex-1 justify-center items-center gap-2 bg-neutral-300 disabled:opacity-35 p-2 border rounded font-semibold text-black">
          Shorten URL
          <GrLinkNext className="sm:block hidden" />
        </button>
      </div>
    </form>
  );
}
