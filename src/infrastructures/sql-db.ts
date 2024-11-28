import { sql } from '@vercel/postgres';

export const bootstrapSQLDB = async () => {
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
        "images" JSONB NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        FOREIGN KEY ("farmer") REFERENCES "farmers" ("id") ON DELETE CASCADE
      );
    `;
  await sql`
      CREATE TABLE IF NOT EXISTS "farmermessages" (
        id UUID PRIMARY KEY,
        farmer UUID NOT NULL,
        sending_user UUID NOT NULL,
        message TEXT,
        amount JSONB,
        created_at TIMESTAMP NOT NULL,
        FOREIGN KEY ("farmer") REFERENCES "farmers" ("id"),
        FOREIGN KEY ("sending_user") REFERENCES "users" ("id")
      );
    `;

  await sql`
      CREATE TABLE IF NOT EXISTS "square_connections" (
        "id" UUID PRIMARY KEY,
        "userId" UUID NOT NULL,
        "merchantId" TEXT NOT NULL,
        "accessToken_encrypted" TEXT NOT NULL,
        "refreshToken_encrypted" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "users" ("id"),
        UNIQUE ("userId", "merchantId")
      );
    `;

  await sql`
      CREATE TABLE IF NOT EXISTS "store_configs" (
        "id" UUID PRIMARY KEY,
        "__type" TEXT NOT NULL,
        "externalId" TEXT NOT NULL,
        "name" TEXT,
        "location" JSONB,
        "logo" TEXT,
        "backgroundImage" TEXT,
        "url" TEXT,
        "farmerAllocation" JSONB,
        "tipConfig" JSONB
      );
    `;
  console.debug('database bootstrapped');
};

export const resetSQLDB = async () => {
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
