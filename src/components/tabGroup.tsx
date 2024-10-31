"use client";
import { motion } from "framer-motion";
import { ComponentPropsWithoutRef, useId, useState } from "react";
import { twMerge } from "tailwind-merge";

type TabGroupBaseProps = Omit<ComponentPropsWithoutRef<"div">, "children">;

export interface TabGroupProps extends TabGroupBaseProps {
  tabs: ReadonlyArray<string>;
  defaultTab?: number | undefined;
  onTabUpdate?: (newTab: number, oldTab: number | undefined) => void;
}

export function createTabGroupTabId(tabName: string) {
  return `tab-${tabName.toLowerCase()}`;
}

export function createTabGroupPanelId(tabName: string) {
  return `panel-${tabName.toLowerCase()}`;
}

export function TabGroup({
  tabs,
  className,
  defaultTab,
  onTabUpdate,
  ...restProps
}: TabGroupProps) {
  const layoutId = useId();
  const [activeId, setActive] = useState<number | undefined>(defaultTab);

  return (
    <div
      className={twMerge(
        "border-neutral-800 p-1 border rounded-lg w-full max-w-fit overflow-hidden overflow-x-auto list-none",
        className,
      )}
      {...restProps}
    >
      <div role="tablist" className={"relative z-10 flex gap-5"}>
        {tabs.map((tab, index) => (
          <button
            key={tab}
            id={createTabGroupTabId(tab)}
            data-active={activeId === index}
            aria-selected={activeId === index}
            className="relative flex items-center gap-2 px-2 py-1.5 rounded text-neutral-500 hover:text-neutral-600 focus-visible:text-neutral-600 data-[active='true']:text-sky-300 transition-colors"
            role="tab"
            aria-controls={createTabGroupPanelId(tab)}
            onClick={() => {
              setActive(index);
              onTabUpdate?.(index, activeId);
            }}
          >
            {tab}
            {activeId === index && (
              <motion.span
                layoutId={layoutId}
                className="-z-10 absolute inset-0 bg-sky-950 rounded"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
