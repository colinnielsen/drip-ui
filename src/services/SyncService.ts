import { mapSliceProductCartToItem } from '@/data-model/item/ItemDTO';
import { ItemRepository } from '@/data-model/item/ItemRepository';
import { Item } from '@/data-model/item/ItemType';
import { mapSliceStoreToShop } from '@/data-model/shop/ShopDTO';
import { ShopRepository } from '@/data-model/shop/ShopRepository';
import { ManualStoreConfig } from '@/data-model/shop/ShopType';
import sliceKit from '@/lib/slicekit';

export class SyncService {
  constructor(
    private shopRepository: ShopRepository,
    private itemRepository: ItemRepository,
  ) {}

  private async fetchStoreData(storeId: number) {
    const [store] = await sliceKit.getStores({ slicerIds: [storeId] });
    const products = await sliceKit.getStoreProducts({ slicerId: storeId });

    return { store, products };
  }

  async syncStores(storeIds: ManualStoreConfig[]) {
    for (const storeConfig of storeIds) {
      const { store, products } = await this.fetchStoreData(
        storeConfig.sliceId,
      );

      // map every slice productƒ to an item object and save
      const items = products.cartProducts.map(mapSliceProductCartToItem);
      for (const item of items) await this.itemRepository.save(item);

      // map the slice store to a shop object and save
      // and map the items to the menu
      const shop = mapSliceStoreToShop(store, storeConfig);

      items.forEach(item => {
        shop.menu[item.category ?? 'other'].push(item);
      });

      await this.shopRepository.save(shop);
    }
  }
}
