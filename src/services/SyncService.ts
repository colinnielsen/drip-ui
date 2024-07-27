import { mapSliceProductCartToItem } from '@/data-model/_common/type/SliceDTO';
import { FarmerRepository } from '@/data-model/farmer/FarmerRepository';
import { Farmer } from '@/data-model/farmer/FarmerType';
import { ItemRepository } from '@/data-model/item/ItemRepository';
import { mapSliceStoreToShop } from '@/data-model/shop/ShopDTO';
import { ShopRepository } from '@/data-model/shop/ShopRepository';
import { ManualStoreConfig } from '@/data-model/shop/ShopType';
import { sliceKit } from '@/lib/slice';

export class SyncService {
  constructor(
    private database: {
      items: ItemRepository;
      shops: ShopRepository;
      farmers: FarmerRepository;
    },
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
      for (const item of items) await this.database.items.save(item);

      // map the slice store to a shop object and save
      // and map the items to the menu
      const shop = mapSliceStoreToShop(store, storeConfig);

      items.forEach(item => {
        const category = item.category ?? 'other';
        if (!shop.menu[category]) shop.menu[category] = [];
        shop.menu[category].push(item);
      });

      await this.database.shops.save(shop);
    }
  }

  async syncFarmers(farmers: Farmer[]) {
    for (const farmer of farmers) {
      await this.database.farmers.save(farmer);
      await this.database.farmers.savePosts(farmer.posts);
    }
  }
}
