import { useQuery } from '@tanstack/react-query';
import { UUID } from 'crypto';
import { axiosFetcher, minutes } from '@/lib/utils';
import { Farmer } from '@/data-model/farmer/FarmerType';

//
//// QUERIES
//
export const useFarmers = () =>
  useQuery({
    queryKey: ['farmers'],
    queryFn: () => axiosFetcher<Farmer[]>('/api/farmers'),
    staleTime: minutes(30),
  });

export const farmerQuery = (id?: UUID, enabled: boolean = true) => {
  return {
    queryKey: ['farmer', id],
    queryFn: () => axiosFetcher<Farmer>(`/api/farmers/${id}`),
    enabled: enabled && !!id,
    staleTime: minutes(30),
  };
};

export const useFarmer = (id?: UUID, enabled: boolean = true) =>
  useQuery({ ...farmerQuery(id, enabled), staleTime: minutes(30) });

//
//// MUTATIONS
//
