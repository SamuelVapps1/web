CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS reservations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  type          text NOT NULL DEFAULT 'booking' CHECK (type IN ('booking','block')),
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','confirmed','cancelled','completed')),
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  client_name   text,
  client_phone  text,
  dog_name      text,
  dog_breed     text,
  dog_size      text CHECK (dog_size IN ('small','medium','large') OR dog_size IS NULL),
  service       text,
  coat_state    text,
  temperament   text,
  notes         text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  discount_code text,
  CHECK (ends_at > starts_at),
  EXCLUDE USING gist (
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status <> 'cancelled')
);

