import { Skeleton } from '@/components/ui/skeleton';
import { Body, Headline, Title2 } from '@/components/ui/typography';
import { useLoginOrCreateUser } from '@/lib/hooks/login';
import { useResetUser, useUser, useUserName } from '@/queries/UserQuery';
import Avatar from 'boring-avatars';
import { LogOut } from 'lucide-react';

export const ProfileInfo = () => {
  const { data: user, isLoading: userIsLoading } = useUser();
  const { data: name, isLoading: nameLoading } = useUserName(user);

  const login = useLoginOrCreateUser({
    // onLogin: data => {
    //   queryClient.setQueryData([ACTIVE_USER_QUERY_KEY], data);
    //   queryClient.refetchQueries({
    //     queryKey: [ORDERS_QUERY_KEY, data.id],
    //   });
    // },
  });

  return (
    <div className="flex justify-between items-center px-6">
      <div className="flex flex-col">
        {nameLoading ? (
          <Skeleton>
            <Title2 className="text-2xl font-bold invisible w-10">
              invisible
            </Title2>
          </Skeleton>
        ) : (
          <Title2 className="text-2xl font-bold">{name}</Title2>
        )}

        {!userIsLoading ? (
          <Body className="text-primary-gray">
            {!user
              ? 'Welcome! ✌️✨'
              : `Joined since ${new Date(user?.createdAt).toLocaleDateString()}`}
          </Body>
        ) : (
          <Skeleton className="h-5 w-20" />
        )}
      </div>

      {userIsLoading ? (
        <Skeleton className="h-20 w-20 rounded-full" />
      ) : (
        <button onClick={() => login()}>
          <Avatar
            variant="beam"
            name={user?.wallet?.address || user?.id || 'guest'}
            size={80}
          />
        </button>
      )}

      {/* {user?.wallet && (
        <>
          <div className="px-6 py-4 flex flex-col gap-4">
            <Headline>Connected Address</Headline>
            <Body>
              {user.wallet?.address.slice(0, 6)}...
              {user.wallet?.address.slice(-4)}
            </Body>
          </div>
          <Divider />
        </>
      )} */}
    </div>
  );
};

export const ResetFooter = () => {
  const { mutate: reset } = useResetUser();

  return (
    <div className="px-6 py-4 flex justify-between items-center">
      <Headline>Sign out and reset</Headline>
      <button onClick={() => reset()}>
        <LogOut height={20} width={20} />
      </button>
    </div>
  );
};
