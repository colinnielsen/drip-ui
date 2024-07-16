import { Cafe } from '@/data-model/cafe/CafeType';
import { ItemCategory } from '@/data-model/item/ItemType';
import { database } from '@/infras/database';
import { axiosFetcher } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { UUID } from 'crypto';

export const useCafes = () =>
  useQuery({
    queryKey: ['cafes'],
    queryFn: () => axiosFetcher('/api/cafes'),
  });

export const cafeQuery = (id: UUID) =>
  ({
    queryKey: ['cafe', id],
    queryFn: () =>
      axiosFetcher(`/api/cafes/${id}`) as ReturnType<
        typeof database.cafes.findById
      >,
  }) as const;

export const useCafe = (id: UUID) => useQuery(cafeQuery(id));

export const useBestSellers = (id: UUID) =>
  useQuery({
    queryKey: ['bestSellers', id],
    queryFn: async () => {
      const cafe = (await axiosFetcher(`/api/cafes/${id}`)) as Awaited<
        ReturnType<typeof database.cafes.findById>
      >;
      if (!cafe || !cafe.bestSellers) {
        throw new Error(`No best sellers found for cafe with id ${id}`);
      }
      return cafe.bestSellers;
    },
  });

export const useItemByName = (id: UUID, category: ItemCategory, name: string) =>
  useQuery({
    queryKey: ['item', id, category, name],
    queryFn: async () => {
      const cafe = (await axiosFetcher(`/api/cafes/${id}`)) as Awaited<
        ReturnType<typeof database.cafes.findById>
      >;
      const item = cafe?.menu?.[category]?.find(item => item.name === name);
      if (!item) {
        throw new Error(
          `Item with name ${name} not found in category ${category}`,
        );
      }
      return item;
    },
  });

export const useCafeItems = (id: UUID) =>
  useQuery({
    queryKey: ['cafeItems', id],
    queryFn: async () => {
      const cafe = (await axiosFetcher(`/api/cafes/${id}`)) as Cafe;
      return cafe.menu;
    },
  });

export const useCategoryOptions = (cafeId: UUID, category: ItemCategory) =>
  useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['menuOptions', cafeId, category],
    queryFn: async () => {
      const cafe = (await axiosFetcher(`/api/cafes/${cafeId}`)) as Cafe;
      const options = cafe.menu[category];
      if (!options.length) {
        throw new Error(`No options found for category ${category}`);
      }
      return options;
    },
  });
