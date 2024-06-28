import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
  DialogClose,
} from "@/components/ui/dialog";
import { useState } from "react";

import Coffee from "@/assets/coffee.jpg";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StaticImageData } from "next/image";

type DialogProps = {
  title: string;
  description: string;
  buttonText: string;
  image: StaticImageData; //image height would depend on description length to look good
  imageAlt: string;
  defaultOpen?: boolean; //from cookies or something?? would be annoying errytime
};

export function WelcomeDialog({
  title,
  description,
  buttonText,
  image,
  imageAlt,
  defaultOpen = true,
}: DialogProps) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogOverlay className="opacity-30">
        <DialogContent className="w-4/5 h-3/4 rounded-xl flex flex-col gap-5">
          <DialogClose className="absolute top-6 right-3 font-semibold text-xl">
            <Close />
          </DialogClose>
          <DialogTitle className="text-left font-semibold text-xl">
            {title}
          </DialogTitle>
          <div className="h-2/3 overflow-hidden">
            <Image src={image} alt={imageAlt} className="rounded-xl" />
          </div>
          <DialogDescription className="text-center font-sans text-[14px]">
            {description}
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                className="bg-black text-white rounded-3xl py-6"
                type="submit"
              >
                {buttonText}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </DialogOverlay>
    </Dialog>
  );
}

function Close() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className="size-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
}
