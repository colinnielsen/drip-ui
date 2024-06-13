type Latitude = number;

type Longitude = number;

export type BaseStore = {
  label: string;
  url?: string;
  farmerInfo?: {
    id: string;
    allocationBPS: number;
  };
};

export type Storefront = BaseStore & {
  __type: "storefront";
  location: [Latitude, Longitude];
};

export type OnlineShop = BaseStore & {
  __type: "online";
  url: string;
};

export type Cafe = Storefront | OnlineShop;
