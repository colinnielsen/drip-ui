import { Cafe } from '@/data-model/cafe/CafeType';
import { ItemCategory } from '@/data-model/item/ItemType';
import { database } from '@/infras/database';
import { useQuery } from '@tanstack/react-query';
import { UUID } from 'crypto';

export const useCafes = () =>
  useQuery({
    queryKey: ['cafes'],
    queryFn: async () => {
      const response = await fetch('/api/cafes');
      if (!response.ok) throw new Error('Failed to fetch cafes');
      return response.json() as ReturnType<typeof database.cafes.findAll>;
    },
  });

export const useCafe = (id: UUID) =>
  useQuery({
    queryKey: ['cafe', id],
    queryFn: async () => {
      const response = await fetch(`/api/cafes/${id}`);
      if (!response.ok) throw new Error(`Cafe with id ${id} not found`);
      return response.json() as ReturnType<typeof database.cafes.findById>;
    },
  });

export const useBestSellers = (id: UUID) =>
  useQuery({
    queryKey: ['bestSellers', id],
    queryFn: async () => {
      const response = await fetch(`/api/cafes/${id}`);
      if (!response.ok) throw new Error(`Cafe with id ${id} not found`);
      const cafe: Awaited<ReturnType<typeof database.cafes.findById>> =
        await response.json();
      if (!cafe || !cafe.bestSellers)
        throw new Error(`No best sellers found for cafe with id ${id}`);
      return cafe.bestSellers;
    },
  });

export const useItemByName = (id: UUID, category: ItemCategory, name: string) =>
  useQuery({
    queryKey: ['item', id, category, name],
    queryFn: async () => {
      const response = await fetch(`/api/cafes/${id}`);
      if (!response.ok) throw new Error(`Cafe with id ${id} not found`);
      const cafe: Awaited<ReturnType<typeof database.cafes.findById>> =
        await response.json();
      const item = cafe?.menu?.[category]?.find(item => item.name === name);
      if (!item)
        throw new Error(
          `Item with name ${name} not found in category ${category}`,
        );
      return item;
    },
  });

export const useCafeItems = (id: UUID) =>
  useQuery({
    queryKey: ['cafeItems', id],
    queryFn: async () => {
      const response = await fetch(`/api/cafes/${id}`);
      if (!response.ok) throw new Error(`Cafe with id ${id} not found`);
      const cafe: Cafe = await response.json();
      return cafe.menu;
    },
  });

export const useCategoryOptions = (cafeId: UUID, category: ItemCategory) =>
  useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['menuOptions', cafeId, category],
    queryFn: async () => {
      const response = await fetch(`/api/cafes/${cafeId}`);
      if (!response.ok) throw new Error(`Cafe with id ${cafeId} not found`);
      const cafe: Cafe = await response.json();
      const options = cafe.menu[category];

      if (!options.length)
        throw new Error(`No options found for category ${category}`);

      return options;
    },
  });
