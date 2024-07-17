import { User } from '@/data-model/user/UserType';
import { axiosFetcher, never } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const ACTIVE_USER_QUERY_KEY = 'user';

export const useActiveUser = () =>
  useQuery({
    queryKey: [ACTIVE_USER_QUERY_KEY],
    queryFn: async () =>
      await axiosFetcher<User>('/api/users/identify', {
        withCredentials: true,
      }).catch((e: any) => {
        if (axios.isAxiosError(e) && e.response?.status === 404)
          return never(
            'Upsert user implementation is probably flawed. Authenticated, but user not found in DB',
          );
        else throw e;
      }),
  });
