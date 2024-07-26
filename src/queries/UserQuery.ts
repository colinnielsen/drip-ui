import { User } from '@/data-model/user/UserType';
import { PRIVY_TOKEN_NAME, SESSION_COOKIE_NAME } from '@/lib/session';
import { axiosFetcher, deleteCookie, err } from '@/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const ACTIVE_USER_QUERY_KEY = 'user';

export const useActiveUser = () =>
  useQuery({
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
  });

export const useResetUser = () => {
  return useMutation({
    mutationFn: () =>
      axiosFetcher('/api/reset').then(() => {
        deleteCookie(PRIVY_TOKEN_NAME);
        deleteCookie(SESSION_COOKIE_NAME);

        if (typeof window !== 'undefined') window.location.reload();
      }),
  });
};
