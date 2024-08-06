// import { PriceLookup, useSlicePrices } from './SliceQuery';

// const getItemPriceFromPriceLookup = (
//   item: Item,
//   priceLookup: PriceLookup,
// ): ItemPrice => {
//   const usualPrice = item.price;
//   const discountedPrice = priceLookup[item.id].discountedPrice;

//   const discountPercentage = usualPrice.eq(discountedPrice)
//     ? 0
//     : 100 -
//       discountedPrice
//         .mul(100)
//         .div(usualPrice.toWei())
//         .div(usualPrice.UNIT)
//         .toWeiNumber();

//   return {
//     itemId: item.id,
//     basePrice: usualPrice,
//     discountPrice: discountedPrice,
//     discountPercentage,
//   };
// };

// const getItemPrices = async (shop: Shop, livePriceLookup: PriceLookup) => {
//   const shopItems = uniqBy(
//     Object.values(shop.menu).reduce(
//       (acc, category) => [...acc, ...category],
//       [],
//     ),
//     'id',
//   );
//   if (shop.__sourceConfig.type === 'slice')
//     return {
//       items: shopItems.map(i =>
//         getItemPriceFromPriceLookup(i, livePriceLookup),
//       ),
//       priceLookup: livePriceLookup,
//     };
//   else throw new Error('other shop price lookups are not implented');
// };

// export const useItemPrices = <TData = ItemPrice[]>({
//   shopId,
//   select,
// }: {
//   shopId: UUID;
//   select?: ({
//     items,
//     priceLookup,
//   }: {
//     items: ItemPrice[];
//     priceLookup: PriceLookup;
//   }) => TData;
// }) => {
//   const wallet = useConnectedWallet();
//   const { data: shop } = useShop(shopId);

//   const { data: slicePrices } = useSlicePrices(shop?.__sourceConfig);

//   return useQuery({
//     queryKey: [
//       // item price for =>
//       'item-prices',
//       // -> for each wallet
//       wallet?.address,
//     ],
//     queryFn:
//       !!shop && !!wallet && !!slicePrices
//         ? () => getItemPrices(shop, slicePrices)
//         : skipToken,
//     enabled: !!shopId && !!wallet,
//     select,
//   });
// };

// function itemPriceSelector(
//   prices: ItemPrice[],
//   priceLookup: PriceLookup,
//   itemId: UUID,
//   mods: UUID[]
// ): ItemPrice | undefined {
//   const itemPrice = prices.find(p => p.itemId === itemId);
//   const itemPriceWithModPrices = priceLookup[itemId].modPrices.reduce((totalAdditionalCosts, modPrice) => {
//     // if(modPrice.modId)
//   }
//   ,itemPrice)
//   return itemPrice;
// }

// export const useItemPrice = (shopId: UUID, itemId: UUID, mods?: UUID[]) =>
//   useItemPrices({
//     shopId,
//     select: ({ items, priceLookup }) =>
//       itemPriceSelector(items, priceLookup, itemId),
//   });
