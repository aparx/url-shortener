"use client";
import { MdErrorOutline } from "react-icons/md";

export function ErrorPage({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="rounded p-3 border border-red-900 bg-red-950 text-red-300 flex gap-3 place-items-center">
      <MdErrorOutline />
      {children}
    </div>
  );
}
