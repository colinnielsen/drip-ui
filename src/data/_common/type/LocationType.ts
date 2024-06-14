export type Latitude = number;

export type Longitude = number;

export type Location = {
  geo: [Latitude, Longitude];
  label: string;
  address: string;
};
