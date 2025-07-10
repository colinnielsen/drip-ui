import { axiosFetcher, minutes } from '@/lib/utils';
import { UserReward } from '@/pages/api/user/rewards';
import { useQuery } from '@tanstack/react-query';
import { useUser } from './UserQuery';

export const useUserRewards = () => {
  const { data: user, isLoading: userLoading } = useUser();

  return useQuery({
    queryKey: ['user-rewards', user?.id],
    queryFn: () => axiosFetcher<UserReward[]>('/api/user/rewards'),
    enabled: !!user?.id && !userLoading,
    staleTime: minutes(5),
    retry: 1,
  });
};
