"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { clsx } from "clsx";

export function Sheet({ open, onOpenChange, children }: Readonly<{ open?: boolean; onOpenChange?: (o: boolean) => void; children: React.ReactNode }>) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>{children}</Dialog.Root>
  );
}

export const SheetTrigger = Dialog.Trigger;

export function SheetContent({ side = "left", children, className }: Readonly<{ side?: "left" | "right"; children: React.ReactNode; className?: string }>) {
  const translate = side === "left" ? "data-[state=open]:translate-x-0 -translate-x-full left-0" : "data-[state=open]:translate-x-0 translate-x-full right-0";
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/70" />
      <Dialog.Content
        className={clsx(
          "fixed top-0 h-full w-64 bg-neutral-950 border-r border-[#C5A059] text-neutral-100 shadow-xl transition-transform",
          translate,
          className
        )}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export const SheetClose = Dialog.Close;
