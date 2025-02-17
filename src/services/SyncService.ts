import {
  buildMenuFromSliceProducts,
  mapSliceStoreToShop,
} from '@/data-model/_external/data-sources/slice/SliceDTO';
import {
  buildMenuFromSquareCatalog,
  mapSquareStoreToShop,
} from '@/data-model/_external/data-sources/square/SquareDTO';
import { Farmer } from '@/data-model/farmer/FarmerType';
import { mapSliceExternalIdToSliceId } from '@/data-model/shop/ShopDTO';
import {
  ShopConfig,
  SliceShopConfig,
  SquareShopConfig,
} from '@/data-model/shop/ShopType';
import { sliceKit } from '@/lib/data-sources/slice';
import { UUID } from 'node:crypto';
import FarmerService from './FarmerService';
import ItemService from './ItemService';
import ShopService from './ShopService';
import { SquareService } from './SquareService';

export class SyncService {
  constructor() {}

  //
  // PRIVATE HELPER METHODS
  //

  private async syncSliceStore(shopConfig: SliceShopConfig) {
    const slicerId: number = mapSliceExternalIdToSliceId(shopConfig.externalId);
    const [store] = await sliceKit.getStores({ slicerIds: [slicerId] });
    const products = await sliceKit.getStoreProducts({ slicerId });

    // map the slice store to a shop object and save
    const shop = mapSliceStoreToShop(store, shopConfig);

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

  private async syncSquareStore(shopConfig: SquareShopConfig) {
    const { merchant, location } = await SquareService.fetchSquareStoreInfo(
      shopConfig.externalId,
    );

    // build the shop
    const shop = mapSquareStoreToShop({
      squareLocation: location,
      squareshopConfig: shopConfig,
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

  async syncStore(externalId: ShopConfig['externalId']): Promise<UUID> {
    const shopConfig = await ShopService.findShopConfigByExternalId(externalId);
    if (!shopConfig) throw new Error('Shop config not found');

    if (shopConfig.__type === 'slice')
      return await this.syncSliceStore(shopConfig);
    else if (shopConfig.__type === 'square')
      return await this.syncSquareStore(shopConfig);

    let err: never = shopConfig;
    throw new Error('Invalid store config type');
  }

  async syncStores() {
    for (const shopConfig of await ShopService.findAllShopConfigs())
      await this.syncStore(shopConfig.externalId);
  }

  async syncFarmers(farmers: Farmer[]) {
    for (const farmer of farmers) {
      await FarmerService.save(farmer);
      await FarmerService.savePosts(farmer.posts);
    }
  }
}
