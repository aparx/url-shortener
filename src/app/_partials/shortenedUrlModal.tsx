import { Button } from "@/components";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IoMdArrowForward, IoMdCheckmarkCircleOutline } from "react-icons/io";
import { MdClose, MdLock, MdLockOpen, MdOutlineCancel } from "react-icons/md";
import QRCode from "react-qr-code";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export interface ShortenedModalProps extends ShortenedModalData {
  onOpenChange?: (isOpened: boolean) => void;
}

export type ShortenedModalData = z.infer<typeof shortenedModalDataSchema>;

export const shortenedModalDataSchema = z.object({
  /** The endpoint's hostname, not the entire URL */
  endpointHostname: z.string(),
  /** The protocol used for the endpoint URL */
  endpointProtocol: z.string(),
  /** The path (mapping alias) for this endpoint */
  path: z.string(),
  hasPassword: z.boolean().optional(),
  hasExpiration: z.boolean().optional(),
  hasOnce: z.boolean().optional(),
});

export function ShortenedUrlModal({
  endpointHostname,
  endpointProtocol,
  hasPassword,
  hasExpiration,
  hasOnce,
  path,
  onOpenChange,
}: ShortenedModalProps) {
  const [opened, setOpened] = useState(true);

  // TODO base64 encode the CreateModalData and use URL to show this modal

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_URL}/${path}`);
  }, []);

  return (
    <Dialog.Root
      open={opened}
      onOpenChange={(x) => {
        setOpened(x);
        onOpenChange?.(x);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="z-40 absolute inset-0 bg-black/[.5]" />
        <Dialog.Content className="top-1/2 left-1/2 z-50 absolute flex flex-col gap-3 border-neutral-800 bg-neutral-950 p-5 border rounded-lg origin-center -translate-x-1/2 -translate-y-1/2 animate-fadeFromBelow">
          <Dialog.Title className="flex justify-between items-center gap-6 font-semibold text-lg">
            Link has been shortened
            <Dialog.Close className="hover:bg-neutral-800 focus-visible:bg-neutral-800 p-0.5 rounded text-neutral-500 hover:text-neutral-300 focus-visible:text-neutral-300 transition-colors">
              <MdClose className="text-lg" />
            </Dialog.Close>
          </Dialog.Title>
          <Dialog.Description asChild>
            <div className="space-y-4 text-neutral-400">
              <div className="flex items-center gap-2 border-neutral-800 bg-neutral-900 p-1 border rounded-lg">
                <Protocol value={endpointProtocol} />
                <div>
                  {endpointHostname} {"->"} {path}
                </div>
              </div>
              <div className="flex gap-6">
                <div className="space-y-3">
                  <span>The link was copied into your clipboard.</span>
                  <AttributeList
                    items={[
                      { name: "Protected by password", checked: hasPassword },
                      { name: "One-Time use only", checked: hasOnce },
                      { name: "Expires after time", checked: hasExpiration },
                    ]}
                  />
                </div>
                <div className="bg-white p-1 max-w-36">
                  <QRCode
                    value={`${process.env.NEXT_PUBLIC_URL}/${path}`}
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
              </div>
              <div className="gap-3 columns-2">
                <Button color="default" asChild>
                  <Link href={"/"}>Back</Link>
                </Button>

                <Button color="cta" asChild>
                  <Link href={`/${path}`}>
                    Visit Link
                    <IoMdArrowForward size="1.25em" />
                  </Link>
                </Button>
              </div>
            </div>
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Protocol({ value }: { value: string }) {
  const isSecure = value.toLowerCase().includes("https");
  return (
    <span
      className={twMerge(
        "inline-flex items-center gap-1 px-1 py-1 rounded font-semibold text-xs",
        isSecure ? "bg-green-950 text-green-300" : "bg-red-950 text-red-300",
      )}
    >
      {isSecure ? <MdLock /> : <MdLockOpen />}
      {value.substring(0, value.length - 1).toUpperCase()}
    </span>
  );
}

function AttributeList({
  items,
}: {
  items: ReadonlyArray<{
    name: string;
    checked: boolean | undefined;
  }>;
}) {
  return (
    <ul aria-label="Attributes" className="flex flex-col gap-2 list-none">
      {items.map(({ name, checked }) => (
        <li
          data-active={checked}
          key={name}
          className="flex items-center gap-2 text-neutral-500 data-[active='true']:text-neutral-300"
        >
          {checked ? (
            <div className="inline-block bg-sky-950 p-0.5 rounded-full text-sky-300">
              <IoMdCheckmarkCircleOutline />
            </div>
          ) : (
            <div className="inline-block bg-neutral-800 p-0.5 rounded-full text-neutral-500">
              <MdOutlineCancel />
            </div>
          )}
          {name}
          <span className="sr-only">{checked ? "Checked" : "Unchecked"}</span>
        </li>
      ))}
    </ul>
  );
}
