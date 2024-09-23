import { mapSliceProductCartToItem } from '@/data-model/_common/type/SliceDTO';
import { Farmer } from '@/data-model/farmer/FarmerType';
import { mapSliceStoreToShop } from '@/data-model/shop/ShopDTO';
import { ManualStoreConfig, Menu } from '@/data-model/shop/ShopType';
import { sliceKit } from '@/lib/slice';
import FarmerService from './FarmerService';
import ShopService from './ShopService';
import ItemService from './ItemService';

export class SyncService {
  constructor() {}

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
      for (const item of items) await ItemService.save(item);

      // map the slice store to a shop object and save
      // and map the items to the menu
      const shop = mapSliceStoreToShop(store, storeConfig);

      const menu = items.reduce<Menu>((acc, item) => {
        const category = item.category ?? 'other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
      }, {});

      await ShopService.save({ ...shop, menu });
    }
  }

  async syncFarmers(farmers: Farmer[]) {
    for (const farmer of farmers) {
      await FarmerService.save(farmer);
      await FarmerService.savePosts(farmer.posts);
    }
  }
}
