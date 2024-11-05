"use client";
import { ComponentPropsWithoutRef, useMemo } from "react";
import { MdLock, MdLockOpen } from "react-icons/md";
import { twMerge } from "tailwind-merge";

const baseClasses =
  "inline-flex items-center gap-1 px-1 py-1 rounded font-semibold text-xs";

export function Secure({
  className,
  children,
  ...restProps
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={twMerge(baseClasses, "bg-green-950 text-green-300", className)}
      {...restProps}
    >
      <MdLock />
      {children}
    </span>
  );
}

export function Insecure({
  className,
  children,
  ...restProps
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={twMerge(baseClasses, "bg-red-950 text-red-300", className)}
      {...restProps}
    >
      <MdLockOpen />
      {children}
    </span>
  );
}

export function Badge({
  protocol,
  render = (realProtocol) => realProtocol.toUpperCase(),
  ...restProps
}: Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  protocol: string;
  render?: (realProtocol: string, isSecure: boolean) => React.ReactNode;
}) {
  const realProtocol = useMemo(() => {
    const terminator = protocol.lastIndexOf(":");
    if (terminator === -1) return protocol;
    return protocol.substring(0, terminator);
  }, [protocol]);

  return useMemo(() => {
    if (!realProtocol.toLowerCase().includes("https"))
      return <Insecure {...restProps}>{render(realProtocol, false)}</Insecure>;
    return <Secure {...restProps}>{render(realProtocol, true)}</Secure>;
  }, [realProtocol]);
}
