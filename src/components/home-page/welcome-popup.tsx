import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
  DialogTitle,
} from '@/components/ui/dialog';
import type { StaticImageData } from 'next/image';
import Image from 'next/image';

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
        <DialogContent className="w-4/5 rounded-xl flex flex-col gap-5">
          <CloseIcon />
          <DialogTitle className="text-left font-semibold text-xl">
            {title}
          </DialogTitle>
          <Image
            src={image}
            alt={imageAlt}
            className="rounded-xl object-cover"
          />
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

export function CloseIcon() {
  return (
    <DialogClose
      className="absolute top-6 right-3 font-semibold text-xl"
      asChild
    >
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
    </DialogClose>
  );
}
