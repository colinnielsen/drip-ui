import { Farmer, FarmerMessage } from '@/data-model/farmer/FarmerType';
import { useQuery } from '@tanstack/react-query';
import Avatar from 'boring-avatars';
import { Label1, Label2 } from '../ui/typography';
import { Divider } from '../ui/divider';

const getFarmerMessages = (farmerId: string): Promise<FarmerMessage[]> => {
  return Promise.resolve([]);
};

const useFarmerMessages = (farmerId: string) => {
  return useQuery({
    queryKey: ['farmer-messages', farmerId],
    queryFn: () => getFarmerMessages(farmerId),
  });
};

export const FarmerMessageBoard = ({ farmer }: { farmer: Farmer }) => {
  const { data: messages } = useFarmerMessages(farmer.id);
  return (
    <div className="flex flex-col gap-5">
      {messages?.map(message => (
        <>
          <div key={message.id} className="flex flex-col gap-y-2 px-6">
            <div className="flex gap-x-2">
              <Avatar size={32} variant="bauhaus" name={message.sendingUser} />
              <Label2 className="text-primary-gray">
                {message.sendingUser.slice(0, 10)}
              </Label2>
              {/* hours / days / mos ago format */}
              <Label1>{message.createdAt.toLocaleString()}</Label1>
            </div>
            <Label2>{message.message}</Label2>
          </div>
          <Divider />
        </>
      ))}
    </div>
  );
};
