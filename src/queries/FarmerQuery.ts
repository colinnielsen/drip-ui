import { useQuery } from '@tanstack/react-query';
import { UUID } from 'crypto';
import { axiosFetcher } from '@/lib/utils';

//
//// QUERIES
//
export const useFarmers = () =>
  useQuery({
    queryKey: ['farmers'],
    queryFn: () => axiosFetcher('/api/farmers'),
  });

export const farmerQuery = (id: UUID) =>
  ({
    queryKey: ['farmer', id],
    queryFn: () => axiosFetcher(`/api/farmers/${id}`),
  }) as const;

export const useFarmer = (id: UUID) => useQuery(farmerQuery(id));

//
//// MUTATIONS
//
