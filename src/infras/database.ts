import { InMemoryFarmerRepository } from './repositories/FarmerRepository';
import { SQLOrderRepository } from './repositories/SQLOrderRepository';
import { SQLUserRepository } from './repositories/SQLUserRepository';
import { SQLShopRepository } from './repositories/SQLShopRepository';
import { SQLItemRepository } from './repositories/SQLItemRepository';
import { sql } from '@vercel/postgres';
const resetDatabase = async () => {
  // await sql`DROP TABLE IF EXISTS shops;`;
  // await sql`DROP TABLE IF EXISTS items;`;
  // await sql`DROP TABLE IF EXISTS orders;`;
  // await sql`DROP TABLE IF EXISTS users;`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      __type TEXT NOT NULL,
      role TEXT NOT NULL,
      authServiceId JSONB,
      wallet JSONB,
      createdAt TIMESTAMP NOT NULL
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS shops (
      id UUID PRIMARY KEY,
      __type TEXT NOT NULL,
      sliceStoreId TEXT NOT NULL,
      label TEXT NOT NULL,
      backgroundImage TEXT,
      logo TEXT,
      url TEXT,
      farmerAllocations JSONB,
      menu JSONB,
      bestSellers JSONB
    );  
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id UUID PRIMARY KEY,
      sliceId TEXT NOT NULL,
      name TEXT NOT NULL,
      price TEXT NOT NULL,
      prettyPrice TEXT NOT NULL,
      currencyDecimals INTEGER NOT NULL,
      currency TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      availability TEXT NOT NULL,
      category TEXT,
      mods JSONB
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY,
      shop UUID NOT NULL,
      user UUID NOT NULL,
      status TEXT NOT NULL,
      timestamp TIMESTAMP NOT NULL,
      orderItems JSONB
    );
`;
};

resetDatabase();

export const database = {
  farmers: new InMemoryFarmerRepository(),
  shops: new SQLShopRepository(),
  items: new SQLItemRepository(),
  orders: new SQLOrderRepository(),
  users: new SQLUserRepository(),
};
