CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "DogSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DONE', 'CANCELLED');

CREATE TABLE "Customer" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "email" text,
  "note" text,
  "createdAt" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Dog" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "customerId" uuid NOT NULL,
  "name" text NOT NULL,
  "breed" text,
  "size" "DogSize" NOT NULL,
  "temperamentNote" text,
  "healthNote" text,
  CONSTRAINT "Dog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Service" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "basePrice" numeric(10,2) NOT NULL,
  "baseDurationMin" integer NOT NULL,
  CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reservation" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "dogId" uuid NOT NULL,
  "serviceIds" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
  "requestedStart" timestamptz(6) NOT NULL,
  "confirmedStart" timestamptz(6),
  "durationMin" integer NOT NULL,
  "customerMessage" text,
  "internalNote" text,
  "sourceCode" text,
  "createdAt" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Dog_customerId_idx" ON "Dog"("customerId");
CREATE INDEX "Reservation_dogId_idx" ON "Reservation"("dogId");
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

ALTER TABLE "Dog"
  ADD CONSTRAINT "Dog_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_dogId_fkey"
  FOREIGN KEY ("dogId") REFERENCES "Dog"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
