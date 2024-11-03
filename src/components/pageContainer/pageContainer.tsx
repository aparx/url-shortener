import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

export function Root({
  className,
  children,
  ...restProps
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={twMerge(
        "flex flex-col flex-shrink gap-5 border-neutral-800 bg-black p-5 border rounded-lg",
        className,
      )}
      {...restProps}
    >
      {children}
    </section>
  );
}

export function Title({
  className,
  children,
  ...restProps
}: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className={twMerge(
        "flex items-center gap-2 font-semibold text-lg",
        className,
      )}
      {...restProps}
    >
      {children}
    </h2>
  );
}
