import { User } from '@/data-model/user/UserType';
import { PRIVY_TOKEN_NAME, SESSION_COOKIE_NAME } from '@/lib/session';
import { axiosFetcher, deleteCookie, err, isSSR } from '@/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

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
      axiosFetcher('/api/reset').then(() => {
        deleteCookie(PRIVY_TOKEN_NAME);
        deleteCookie(SESSION_COOKIE_NAME);
        localStorage.clear();
        // await fetch('/api/reset');

        if (typeof window !== 'undefined') window.location.assign('/');
      }),
  });
};
