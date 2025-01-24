import { Brand } from 'effect';
import { Currency } from '../_common/currency';
import { ItemCategory, ItemSourceConfig } from './common';
import { ItemMod } from './ItemMod';

//
//// VARIANT
//

export type ItemVariantId = string & Brand.Brand<'ItemVariantId'>;
export const ItemVariantId = Brand.nominal<ItemVariantId>();

/**
 * @dev A variant is a specific configuration of an item.
 * @important a user will select and buy this item. A
 * @important a {@link LineItem} will represent `n` amount of selected {@link ItemVariant} with homogenous {@link ItemMod}
 */
export type ItemVariant = {
  id: ItemVariantId;
  /** the configuration object for the platform the item came from: i.e., slice, square */
  __sourceConfig: ItemSourceConfig;
  /** e.g., "Large", "Medium", "Small" */
  name: string;
  /** The image of the item */
  image: string;
  /** The description of the item */
  description: string;
  /** Price of this variant */
  price: Currency;
  /** The availability of the item */
  availability?: 'onsite-only' | 'online-only' | 'delivery';
};

//
//// ITEM
//

export type ItemId = string & Brand.Brand<'ItemId'>;
export const ItemId = Brand.nominal<ItemId>();

/**
 * @dev Every item will present itself in the shop page.
 * @important a user does not select and buy an item, the buy a {@link ItemVariant}
 * notes:
 * - Each {@link Item} _must_ have at least one variant, and that variant contains the price of each item
 * - Each {@link ItemVariant} _can_ have different selectable mods
 * - When a user selects an item, they _must_ select a variant
 */
export type Item = {
  id: ItemId;
  /** The name of the item */
  name: string;
  /** The description of the item */
  description: string;
  /** The image of the item */
  image: string;
  /** The category of the item or an unknown string */
  category: (ItemCategory & {}) | null;
  /** @dev at least one variant is enforced */
  variants: [ItemVariant, ...ItemVariant[]];
  /** Mods that can be added on this item */
  mods?: ItemMod[] | null;
};
