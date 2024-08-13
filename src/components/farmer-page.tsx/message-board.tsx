import { Farmer } from '@/data-model/farmer/FarmerType';
import { useFarmerMessages } from '@/queries/FarmerQuery';
import { userNameQuery, useUser } from '@/queries/UserQuery';
import { useQueries } from '@tanstack/react-query';
import Avatar from 'boring-avatars';
import { formatDistance } from 'date-fns';
import { Label1, Label2 } from '../ui/typography';

const CELEBRATION_EMOJIS = ['🎉', '🎊', '🎁', '🎀', '🕺🏼', '🔥', '🧨'];

export const FarmerMessageBoard = ({ farmer }: { farmer: Farmer }) => {
  const { data: messages } = useFarmerMessages(farmer.id);
  const { data: user } = useUser();
  const nameQueries = useQueries({
    queries: (messages ?? [])?.map(message =>
      userNameQuery(message.sendingUser, message.sendingUser?.id === user?.id),
    ),
  });

  return (
    <div className="flex flex-col  divide-y divide-light-gray">
      {messages?.map((message, index) => {
        const messageType = message.message ? 'message' : 'donation';
        const name = nameQueries[index].data;
        return (
          <div key={message.id} className="flex flex-col gap-y-2 px-6 py-5">
            <div className="flex gap-x-2 items-center ">
              <Avatar
                size={32}
                variant="bauhaus"
                name={message.sendingUser.id}
              />
              <Label2 className="text-black">{name}</Label2>
              {/* hours / days / mos ago format */}
              <Label1 className="text-primary-gray text-center">
                {formatDistance(message.createdAt, new Date(), {
                  addSuffix: true,
                })}
              </Label1>
            </div>
            {messageType === 'message' ? (
              <Label2>{message.message}</Label2>
            ) : (
              <Label2 className="flex items-center gap-x-1">
                Sent ${message.amount?.prettyFormat()} USDC{' '}
                {
                  CELEBRATION_EMOJIS[
                    Math.floor(Math.random() * CELEBRATION_EMOJIS.length)
                  ]
                }
                {
                  CELEBRATION_EMOJIS[
                    Math.floor(Math.random() * CELEBRATION_EMOJIS.length)
                  ]
                }
              </Label2>
            )}
          </div>
        );
      })}
    </div>
  );
};
