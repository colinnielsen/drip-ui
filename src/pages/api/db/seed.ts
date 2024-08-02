import { sqlDatabase } from '@/infras/database';
import { ONBOARDED_SHOPS, STATIC_FARMER_DATA } from '@/lib/static-data';
import { SyncService } from '@/services/SyncService';
import { sql } from '@vercel/postgres';
import { NextApiRequest, NextApiResponse } from 'next';

const _resetDB = async () => {
  console.debug('resetting database...');
  // await sql`
  //   DROP TABLE IF EXISTS "orders";
  // `;
  // await sql`
  //   DROP TABLE IF EXISTS "shops";
  // `;
  // await sql`
  //   DROP TABLE IF EXISTS "items";
  // `;
  // await sql`
  //   DROP TABLE IF EXISTS "farmerposts";
  // `;
  // await sql`
  //   DROP TABLE IF EXISTS "farmermessages";
  // `;
  // await sql`
  //   DROP TABLE IF EXISTS "farmers";
  // `;
  // await sql`
  //   DROP TABLE IF EXISTS "users";
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
      "bestSellers" JSONB,
      "location" JSONB,
      "tipConfig" JSONB
    );  
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "items" (
      "id" UUID PRIMARY KEY,
      "__sourceConfig" JSONB,
      "name" TEXT NOT NULL,
      "price" JSONB NOT NULL,
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
      "transactionHash" TEXT,
      "externalOrderInfo" JSONB,
      FOREIGN KEY ("shop") REFERENCES "shops" ("id"),
      FOREIGN KEY ("user") REFERENCES "users" ("id")
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "farmers" (
      "id" UUID PRIMARY KEY,
      "name" TEXT NOT NULL,
      "image" TEXT NOT NULL,
      "pfp" TEXT,
      "campaigns" JSONB,
      "shortDescription" TEXT NOT NULL,
      "bio" TEXT,
      "bioImages" JSONB,
      "infoUrl" TEXT NOT NULL,
      "ethAddress" TEXT NOT NULL
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "farmerposts" (
      "id" UUID PRIMARY KEY,
      "farmer" UUID NOT NULL,
      "title" TEXT NOT NULL,
      "image" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL,
      FOREIGN KEY ("farmer") REFERENCES "farmers" ("id") ON DELETE CASCADE
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "farmermessages" (
      "id" UUID PRIMARY KEY,
      "farmer" UUID NOT NULL,
      "sendingUser" UUID NOT NULL,
      "message" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL,
      FOREIGN KEY ("farmer") REFERENCES "farmers" ("id"),
      FOREIGN KEY ("sendingUser") REFERENCES "users" ("id")
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
