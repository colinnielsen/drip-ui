export type Latitude = number;

export type Longitude = number;

export type Location = {
  coords: [Latitude, Longitude];
  label: string;
  address: string;
};
