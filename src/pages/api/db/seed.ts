import { sqlDatabase } from '@/infras/database';
import { ONBOARDED_SHOPS, STATIC_FARMER_DATA } from '@/lib/constants';
import { SyncService } from '@/services/SyncService';
import { sql } from '@vercel/postgres';
import { NextApiRequest, NextApiResponse } from 'next';

const _resetDB = async () => {
  console.debug('resetting database...');
  // await sql`
  //   DROP TABLE IF EXISTS "users";
  // `;
  // await sql`
  //   DROP TABLE IF EXISTS "shops";
  // `;
  // await sql`
  //   DROP TABLE IF EXISTS "items";
  // `;
  // await sql`
  //   DROP TABLE IF EXISTS "orders";
  // `;
  // await sql`
  //   DROP TABLE IF EXISTS "farmers";
  // `;
  console.debug('database reset');
};

export const bootstrapDB = async () => {
  console.debug('bootstrapping database...');

  await sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" UUID PRIMARY KEY,
      "__type" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "authServiceId" JSONB,
      "wallet" JSONB,
      "createdAt" TIMESTAMP NOT NULL
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "shops" (
      "id" UUID PRIMARY KEY,
      "__type" TEXT NOT NULL,
      "__sourceConfig" JSONB,
      "label" TEXT NOT NULL,
      "backgroundImage" TEXT,
      "logo" TEXT,
      "url" TEXT,
      "farmerAllocations" JSONB,
      "menu" JSONB,
      "bestSellers" JSONB
    );  
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "items" (
      "id" UUID PRIMARY KEY,
      "__sourceConfig" JSONB,
      "name" TEXT NOT NULL,
      "price" TEXT NOT NULL,
      "prettyPrice" TEXT NOT NULL,
      "currencyDecimals" INTEGER NOT NULL,
      "currency" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "image" TEXT NOT NULL,
      "availability" TEXT NOT NULL,
      "category" TEXT,
      "mods" JSONB
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "orders" (
      "id" UUID PRIMARY KEY,
      "shop" UUID NOT NULL,
      "user" UUID NOT NULL,
      "status" TEXT NOT NULL,
      "timestamp" TIMESTAMP NOT NULL,
      "orderItems" JSONB,
      "tip" JSONB,
      "transactionHash" TEXT
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "farmers" (
      "id" UUID PRIMARY KEY,
      "name" TEXT NOT NULL,
      "image" TEXT NOT NULL,
      "shortDescription" TEXT NOT NULL,
      "infoUrl" TEXT NOT NULL,
      "ethAddress" TEXT NOT NULL
    );
  `;
  console.debug('database bootstrapped');
};

const syncService = new SyncService(sqlDatabase);

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  if (_req.query.reset) await _resetDB();

  await bootstrapDB();

  await Promise.all([
    syncService.syncStores(ONBOARDED_SHOPS),
    syncService.syncFarmers(STATIC_FARMER_DATA),
  ])
    .then(() => {
      res.status(200).json({ message: 'Seeding complete' });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.message });
    });
}
