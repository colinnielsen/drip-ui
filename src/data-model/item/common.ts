export type ItemCategory = 'espresso' | 'coffee' | 'tea' | 'food' | string;
export type ModCategory = ItemCategory;
/** the configuration object for the platform the item came from: i.e., slice, square */
export type ItemSourceConfig =
  | {
      type: 'slice';
      /**
       * the product item id in the slice store
       */
      id: string;
      version: number;
    }
  | {
      type: 'square';
      id: string;
    };

export type ModSourceConfig = ItemSourceConfig;
