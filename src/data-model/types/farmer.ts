export type FarmerMessage = {
  farmerId: string;
  sendingUserId: string;
  message: string;
};

export type Farmer = {
  id: string;
  name: string;
  image: string;
  shortDescription: string;
  infoUrl: string;
  ethAddress: string;
};
