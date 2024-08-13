import { Farmer } from '@/data-model/farmer/FarmerType';
import { useState } from 'react';
import { CTAButton, SecondaryButton } from '../ui/button';
import { Divider } from '../ui/divider';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';
import { Label1, Title1 } from '../ui/typography';
import { useMessage } from '@/queries/FarmerQuery';

export const SendMessageButton = ({ farmer }: { farmer: Farmer }) => {
  const [text, setText] = useState('');
  const { mutateAsync: message, isPending: sending } = useMessage();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <SecondaryButton
          variant="secondary-small"
          className="grow"
          disabled={sending}
        >
          send message
        </SecondaryButton>
      </DrawerTrigger>

      <DrawerContent className="flex flex-col gap-4 w-full p-0">
        <DrawerTitle className="px-6 pt-4 grow text-center">
          <Title1>Post a message</Title1>
        </DrawerTitle>
        <Label1 className="px-6 text-primary-gray text-center">
          Got something to say to {farmer.name.split(' ')[0]}? Share your
          thoughts
        </Label1>
        <textarea
          className="bg-light-gray rounded-3xl p-4 px-6 mx-6 resize-none h-48 active:border-secondary-pop font-mono text-sm"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <Divider />
        <DrawerFooter className="p-6 pt-0">
          <CTAButton
            disabled={text.length === 0 || sending}
            type="submit"
            onClick={() => message({ farmer, message: text })}
          >
            Send
          </CTAButton>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
