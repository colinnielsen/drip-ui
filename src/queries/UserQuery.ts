import { TESTING_USER, User } from '@/data-model/user/UserType';
import { axiosFetcher } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const ACTIVE_USER_QUERY_KEY = 'active-user';

export const useActiveUser = () =>
  useQuery({
    queryKey: [ACTIVE_USER_QUERY_KEY],
    // retry: false,
    queryFn: async () =>
      await axiosFetcher<User>('/api/users/identify', {
        withCredentials: true,
      }).catch((e: any) => {
        if (axios.isAxiosError(e)) {
          if (e.response?.status === 404) return 'not-created';
        }
        return TESTING_USER;
      }), // await Promise.resolve(TESTING_USER),
  });
