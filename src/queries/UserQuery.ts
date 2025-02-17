import { User } from '@/data-model/user/UserType';
import { axiosFetcher, err, isSSR } from '@/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { createClient, http } from 'viem';
import { getEnsName } from 'viem/actions';
import { mainnet } from 'viem/chains';

export const ACTIVE_USER_QUERY_KEY = 'user';

const userQuery = <TData = User>(opts?: {
  select?: (user: User | null) => TData;
}) => ({
  queryKey: [ACTIVE_USER_QUERY_KEY],
  queryFn: async () =>
    await axiosFetcher<User>('/api/auth/identify', {
      withCredentials: true,
    }).catch((e: any) => {
      if (!axios.isAxiosError(e)) throw e;
      if (e.response?.status === 404) return err('stale cookies?');
      if (e.response?.status === 401) return null;

      throw e;
    }),
  enabled: !isSSR(),
  ...opts,
});

export const useUser = () => {
  const query = useQuery(userQuery());
  return query;
};

export const useUserId = () =>
  useQuery(userQuery({ select: user => user?.id }));

export const useResetUser = () => {
  return useMutation({
    mutationFn: () =>
      axiosFetcher('/api/reset').then(async () => {
        // await axios('https://auth.privy.io/api/v1/sessions/logout', {
        //   withCredentials: true,
        // });
        localStorage.clear();

        if (typeof window !== 'undefined') window.location.assign('/');
      }),
  });
};

export function userNameQuery(
  user: User | null | undefined,
  isYourUser: boolean,
) {
  return {
    queryKey: ['user', 'username', user?.id],
    queryFn: () =>
      user?.wallet?.address
        ? getEnsName(createClient({ chain: mainnet, transport: http() }), {
            address: user?.wallet?.address!,
          }).then(n =>
            !n ? (isYourUser ? 'You' : user?.wallet?.address?.slice(0, 6)) : n,
          )
        : Promise.resolve('Guest'),
    enabled: user !== undefined,
  };
}

export const useUserName = (user?: User | null) => {
  const { data: connectedUser, isLoading: userIsLoading } = useUser();
  const isYourUser = user?.id === connectedUser?.id;

  return useQuery(userNameQuery(user, isYourUser));
};
