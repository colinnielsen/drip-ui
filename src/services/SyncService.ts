import {
  buildMenuFromSliceProducts,
  getSlicerIdFromSliceStoreId,
  mapSliceStoreToShop,
} from '@/data-model/_external/data-sources/slice/SliceDTO';
import {
  buildMenuFromSquareCatalog,
  mapSquareStoreToShop,
} from '@/data-model/_external/data-sources/square/SquareDTO';
import { Farmer } from '@/data-model/farmer/FarmerType';
import {
  SliceStoreConfig,
  SquareStoreConfig,
  StoreConfig,
} from '@/data-model/shop/ShopType';
import { sliceKit } from '@/lib/slice';
import { UUID } from 'node:crypto';
import FarmerService from './FarmerService';
import ItemService from './ItemService';
import ShopService from './ShopService';
import { SquareService } from './SquareService';

export class SyncService {
  constructor() {}

  private async syncSliceStore(storeConfig: SliceStoreConfig) {
    const slicerId: number = getSlicerIdFromSliceStoreId(
      storeConfig.externalId,
    );
    const [store] = await sliceKit.getStores({ slicerIds: [slicerId] });
    const products = await sliceKit.getStoreProducts({ slicerId });

    // map the slice store to a shop object and save
    const shop = mapSliceStoreToShop(store, storeConfig);

    // build the menu and items
    const { menu, items } = await buildMenuFromSliceProducts(
      products.cartProducts,
    );

    // save the items
    await Promise.all(items.map(item => ItemService.save(item)));
    // save the shop
    const savedShop = await ShopService.save({ ...shop, menu });

    return savedShop.id;
  }

  private async syncSquareStore(storeConfig: SquareStoreConfig) {
    const { merchant, location } = await SquareService.fetchSquareStoreInfo(
      storeConfig.externalId,
    );

    // build the shop
    const shop = mapSquareStoreToShop({
      merchantId: storeConfig.externalId,
      squareStore: merchant,
      squareLocation: location,
      storeConfig,
    });

    const { menu, items } = await buildMenuFromSquareCatalog({
      merchant,
      location,
    });

    // save the items
    await Promise.all(items.map(item => ItemService.save(item)));
    // save the shop
    const savedShop = await ShopService.save({ ...shop, menu });
    return savedShop.id;
  }

  //
  // PUBLIC SYNC METHODS
  //

  async syncStore(externalId: StoreConfig['externalId']): Promise<UUID> {
    const storeConfig =
      await ShopService.findStoreConfigByExternalId(externalId);
    if (!storeConfig) throw new Error('Store config not found');

    if (storeConfig.__type === 'slice')
      return await this.syncSliceStore(storeConfig);
    else if (storeConfig.__type === 'square')
      return await this.syncSquareStore(storeConfig);

    let err: never = storeConfig;
    throw new Error('Invalid store config type');
  }

  async syncStores() {
    for (const storeConfig of await ShopService.findAllStoreConfigs())
      await this.syncStore(storeConfig.externalId);
  }

  async syncFarmers(farmers: Farmer[]) {
    for (const farmer of farmers) {
      await FarmerService.save(farmer);
      await FarmerService.savePosts(farmer.posts);
    }
  }
}
