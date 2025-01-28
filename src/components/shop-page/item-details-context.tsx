import { Item } from '@/data-model/item/ItemType';
import { UUID } from '@/data-model/_common/type/CommonType';
import { createContext, useContext, useState, ReactNode } from 'react';

type ItemDetailsContextType = {
  selectedItem: Item | null;
  setSelectedItem: (item: Item | null) => void;
  shopId: UUID;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ItemDetailsContext = createContext<ItemDetailsContextType | undefined>(
  undefined,
);

export function ItemDetailsProvider({
  children,
  shopId,
}: {
  children: ReactNode;
  shopId: UUID;
}) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <ItemDetailsContext.Provider
      value={{ selectedItem, setSelectedItem, shopId, open, setOpen }}
    >
      {children}
    </ItemDetailsContext.Provider>
  );
}

export function useItemDetails() {
  const context = useContext(ItemDetailsContext);
  if (!context) {
    throw new Error(
      'useItemDetails must be used within an ItemDetailsProvider',
    );
  }
  return context;
}
