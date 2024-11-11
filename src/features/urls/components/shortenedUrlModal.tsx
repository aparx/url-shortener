import { Button } from "@/components";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { IoMdArrowForward } from "react-icons/io";
import { MdClose, MdLock, MdLockClock, MdTimer } from "react-icons/md";
import QRCode from "react-qr-code";
import { z } from "zod";
import { Badge } from "../../../components/badge";

export interface ShortenedModalProps extends ShortenedModalData {
  onOpenChange?: (isOpened: boolean) => void;
}

export type ShortenedModalData = z.infer<typeof shortenedModalDataSchema>;

export const shortenedModalDataSchema = z.object({
  /** The endpoint's hostname, not the entire URL */
  endpointHostname: z.string(),
  /** The protocol used for the endpoint URL */
  endpointProtocol: z.string(),
  hasPassword: z.boolean().optional(),
  hasExpiration: z.boolean().optional(),
  hasOnce: z.boolean().optional(),
  path: z.string(),
  secure: z.boolean().nullish().optional(),
});

export function ShortenedUrlModal({
  endpointHostname,
  endpointProtocol,
  hasPassword,
  hasExpiration,
  hasOnce,
  secure,
  path,
  onOpenChange,
}: ShortenedModalProps) {
  const [opened, setOpened] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_URL}/${path}`);
  }, [path]);

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
                <Badge.Protocol protocol={endpointProtocol} />
                <div>
                  {endpointHostname} {"->"} {path}
                </div>
              </div>
              <div className="flex gap-6">
                <div className="space-y-3">
                  <span>The link was copied into your clipboard.</span>
                  <AttributeList>
                    <Attribute
                      name="Link is secure"
                      checked={!!secure}
                      icon={<MdLock />}
                    />
                    <Attribute
                      name="Protected by password"
                      checked={!!hasPassword}
                      icon={<MdLock />}
                    />
                    <Attribute
                      name="One-Time use only"
                      checked={!!hasOnce}
                      icon={<MdTimer />}
                    />
                    <Attribute
                      name="Expires after time"
                      checked={!!hasExpiration}
                      icon={<MdLockClock />}
                    />
                  </AttributeList>
                </div>
                <div className="border-white bg-neutral-200 p-2 border rounded-lg max-w-36">
                  <QRCode
                    value={`${process.env.NEXT_PUBLIC_URL}/${path}`}
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    bgColor="transparent"
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

function AttributeList({
  children,
}: {
  children: Array<React.ReactElement<Parameters<typeof Attribute>[0]>>;
}) {
  return (
    <ul aria-label="Attributes" className="flex flex-col gap-2 list-none">
      {children.map((x) => (
        <li key={x.props.name}>{x}</li>
      ))}
    </ul>
  );
}

function Attribute({
  name,
  icon,
  checked,
}: {
  name: string;
  icon: React.ReactNode;
  checked: boolean;
}) {
  return (
    <div
      data-active={checked}
      key={name}
      className={`flex items-center gap-2 text-neutral-500 data-[active='true']:text-neutral-300 ${!checked ? "line-through" : ""}`}
    >
      <div
        className={`inline-block p-1 rounded-full ${checked ? "bg-sky-950 text-sky-300" : "bg-neutral-800 text-neutral-500"}`}
      >
        {icon}
      </div>
      {name}
      <span className="sr-only">{checked ? "Checked" : "Unchecked"}</span>
    </div>
  );
}
