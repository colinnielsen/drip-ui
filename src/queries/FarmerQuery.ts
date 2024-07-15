import { database } from '@/infras/database';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { UUID } from 'crypto';

//
//// QUERIES
//
export const useFarmers = () =>
  useQuery({
    queryKey: ['farmers'],
    queryFn: async () => await database.farmers.findAll(),
  });

export const farmerQuery = (id: UUID) =>
  queryOptions({
    queryKey: ['farmer', id],
    queryFn: async () => await database.farmers.findById(id),
  });

export const useFarmer = (id: UUID) => useQuery(farmerQuery(id));

//
//// MUTATIONS
//
