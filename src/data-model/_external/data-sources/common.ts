import { Menu } from '@/data-model/shop/ShopType';
import { Item, ItemCategory } from '../../item/ItemType';

const commonEspressoNames = [
  'espresso',
  'macchiato',
  'cortado',
  'americano',
  'mocha',
  'latte',
  'cappuccino',
  'capp',
  'cap',
];

const commonCoffeeNames = [
  'pour over',
  'coffee',
  'drip',
  'batch',
  'brewed',
  'nitro',
  'cafe',
];

const commonTeaNames = ['chai', 'tea'];

const commonFoodNames = [
  'parfait',
  'yogurt',
  'smoothie',
  'salad',
  'croissant',
  'bagel',
  'burrito',
];

export const deriveCategoryFromItemName = (
  itemName: string,
): ItemCategory | null => {
  const itemName_chunked = itemName
    .toLowerCase()
    .split(' ')
    .flatMap(chunk => chunk.split('-'));

  if (commonEspressoNames.some(name => itemName_chunked.includes(name)))
    return 'espresso';
  if (commonCoffeeNames.some(name => itemName_chunked.includes(name)))
    return 'coffee';
  if (commonFoodNames.some(name => itemName_chunked.includes(name)))
    return 'food';
  if (commonTeaNames.some(name => itemName_chunked.includes(name)))
    return 'tea';

  return null;
};

// TODO
export const deriveDefaultImageFromItemName = (
  itemName: string | undefined | null,
) => {
  return '/drip.png';
};

export function buildMenuFromItems(items: Item[]): Menu {
  return items.reduce<Menu>((acc, item) => {
    const category = item.category ?? 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});
}
