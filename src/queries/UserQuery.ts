import { User } from '@/data-model/user/UserType';
import { PRIVY_TOKEN_NAME, SESSION_COOKIE_NAME } from '@/lib/session';
import { axiosFetcher, deleteCookie, err, isSSR } from '@/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { createClient, http } from 'viem';
import { getEnsName } from 'viem/actions';
import { mainnet } from 'viem/chains';

export const ACTIVE_USER_QUERY_KEY = 'user';

const userQuery = <TData = User>(opts?: {
  select?: (user: User) => TData;
}) => ({
  queryKey: [ACTIVE_USER_QUERY_KEY],
  queryFn: async () =>
    await axiosFetcher<User>('/api/users/identify', {
      withCredentials: true,
    }).catch((e: any) => {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        // deleteCookie(PRIVY_TOKEN_NAME);
        // deleteCookie(SESSION_COOKIE_NAME);
        return err('stale cookies?');
      } else throw e;
    }),
  enabled: !isSSR(),
  ...opts,
});

export const useUser = () => useQuery(userQuery());

export const useUserId = () =>
  useQuery(userQuery({ select: user => user?.id }));

export const useResetUser = () => {
  return useMutation({
    mutationFn: () =>
      axiosFetcher('/api/reset').then(async () => {
        // await axios('https://auth.privy.io/api/v1/sessions/logout', {
        //   withCredentials: true,
        // });
        deleteCookie(PRIVY_TOKEN_NAME);
        deleteCookie(SESSION_COOKIE_NAME);
        localStorage.clear();

        if (typeof window !== 'undefined') window.location.assign('/');
      }),
  });
};

export function userNameQuery(user: User | undefined, isYourUser: boolean) {
  return {
    queryKey: ['user', 'username', user?.id],
    queryFn: () =>
      user?.__type === 'user'
        ? getEnsName(createClient({ chain: mainnet, transport: http() }), {
            address: user?.wallet?.address!,
          }).then(n =>
            !n ? (isYourUser ? 'You' : user.wallet.address.slice(0, 6)) : n,
          )
        : Promise.resolve('Guest'),
    enabled: !!user,
  };
}

export const useUserName = (user?: User) => {
  const { data: connectedUser } = useUser();
  const isYourUser = user?.id === connectedUser?.id;

  return useQuery(userNameQuery(user, isYourUser));
};
