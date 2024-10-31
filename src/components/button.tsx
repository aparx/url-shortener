import { Slot } from "@radix-ui/react-slot";
import { ComponentPropsWithoutRef, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export type ButtonRef = HTMLButtonElement;

export interface ButtonBaseProps extends ComponentPropsWithoutRef<"button"> {
  color?: keyof typeof colorMap;
  asChild?: boolean;
}

const colorMap = {
  cta: "bg-neutral-300 text-neutral-950 border-neutral-100 font-semibold",
  default: `bg-neutral-900 text-neutral-400 border-neutral-800`,
  sky: "bg-sky-950 text-sky-400 border-sky-800",
} as const satisfies Record<string, string>;

export const Button = forwardRef<ButtonRef, ButtonBaseProps>(
  function Button(props, ref) {
    const {
      className,
      children,
      color = "default",
      asChild,
      ...restProps
    } = props;
    const Component = asChild ? Slot : "button";
    return (
      <Component
        ref={ref}
        className={twMerge(
          `relative after:absolute after:inset-0 flex justify-center items-center gap-2 hover:after:bg-black/[.25] focus-visible:after:bg-black/[.2] disabled:opacity-35 p-2 border rounded after:rounded whitespace-nowrap`,
          colorMap[color],
          className,
        )}
        {...restProps}
      >
        {children}
      </Component>
    );
  },
);
