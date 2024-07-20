import { useQuery } from '@tanstack/react-query';
import { UUID } from 'crypto';
import { axiosFetcher } from '@/lib/utils';
import { Farmer } from '@/data-model/farmer/FarmerType';

//
//// QUERIES
//
export const useFarmers = () =>
  useQuery({
    queryKey: ['farmers'],
    queryFn: () => axiosFetcher<Farmer[]>('/api/farmers'),
  });

export const farmerQuery = (id?: UUID, enabled: boolean = true) => {
  return {
    queryKey: ['farmer', id],
    queryFn: () => axiosFetcher<Farmer>(`/api/farmers/${id}`),
    enabled: enabled && !!id,
  };
};

export const useFarmer = (id?: UUID, enabled: boolean = true) =>
  useQuery(farmerQuery(id, enabled));

//
//// MUTATIONS
//
