import { sql } from '@vercel/postgres';
import { normalizeReservationRecord, type NewReservationInput, type ReservationRecord, type ReservationStatus } from '@/lib/reservations';

function toIsoString(value: Date): string {
  return value.toISOString();
}

export async function listReservationsBetween(start: Date, end: Date): Promise<ReservationRecord[]> {
  const result = await sql`
    SELECT
      id,
      created_at,
      updated_at,
      type,
      status,
      starts_at,
      ends_at,
      client_name,
      client_phone,
      dog_name,
      dog_breed,
      dog_size,
      service,
      coat_state,
      temperament,
      notes,
      utm_source,
      utm_medium,
      utm_campaign,
      discount_code
    FROM reservations
    WHERE starts_at < ${toIsoString(end)}
      AND ends_at > ${toIsoString(start)}
    ORDER BY starts_at ASC, created_at ASC
  `;

  return result.rows.map((row) => normalizeReservationRecord(row as Record<string, unknown>));
}

export async function getReservationById(id: string): Promise<ReservationRecord | null> {
  const result = await sql`
    SELECT
      id,
      created_at,
      updated_at,
      type,
      status,
      starts_at,
      ends_at,
      client_name,
      client_phone,
      dog_name,
      dog_breed,
      dog_size,
      service,
      coat_state,
      temperament,
      notes,
      utm_source,
      utm_medium,
      utm_campaign,
      discount_code
    FROM reservations
    WHERE id = ${id}
    LIMIT 1
  `;

  const row = result.rows[0];
  return row ? normalizeReservationRecord(row as Record<string, unknown>) : null;
}

export async function createReservation(input: NewReservationInput): Promise<ReservationRecord> {
  const result = await sql`
    INSERT INTO reservations (
      type,
      status,
      starts_at,
      ends_at,
      client_name,
      client_phone,
      dog_name,
      dog_breed,
      dog_size,
      service,
      coat_state,
      temperament,
      notes,
      utm_source,
      utm_medium,
      utm_campaign,
      discount_code
    ) VALUES (
      ${input.type},
      ${input.status},
      ${toIsoString(input.startsAt)},
      ${toIsoString(input.endsAt)},
      ${input.clientName ?? null},
      ${input.clientPhone ?? null},
      ${input.dogName ?? null},
      ${input.dogBreed ?? null},
      ${input.dogSize ?? null},
      ${input.service ?? null},
      ${input.coatState ?? null},
      ${input.temperament ?? null},
      ${input.notes ?? null},
      ${input.utmSource ?? null},
      ${input.utmMedium ?? null},
      ${input.utmCampaign ?? null},
      ${input.discountCode ?? null}
    )
    RETURNING
      id,
      created_at,
      updated_at,
      type,
      status,
      starts_at,
      ends_at,
      client_name,
      client_phone,
      dog_name,
      dog_breed,
      dog_size,
      service,
      coat_state,
      temperament,
      notes,
      utm_source,
      utm_medium,
      utm_campaign,
      discount_code
  `;

  return normalizeReservationRecord(result.rows[0] as Record<string, unknown>);
}

export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<ReservationRecord | null> {
  const result = await sql`
    UPDATE reservations
    SET status = ${status},
        updated_at = now()
    WHERE id = ${id}
    RETURNING
      id,
      created_at,
      updated_at,
      type,
      status,
      starts_at,
      ends_at,
      client_name,
      client_phone,
      dog_name,
      dog_breed,
      dog_size,
      service,
      coat_state,
      temperament,
      notes,
      utm_source,
      utm_medium,
      utm_campaign,
      discount_code
  `;

  const row = result.rows[0];
  return row ? normalizeReservationRecord(row as Record<string, unknown>) : null;
}

export async function updateReservationEndsAt(id: string, endsAt: Date): Promise<ReservationRecord | null> {
  const result = await sql`
    UPDATE reservations
    SET ends_at = ${toIsoString(endsAt)},
        updated_at = now()
    WHERE id = ${id}
    RETURNING
      id,
      created_at,
      updated_at,
      type,
      status,
      starts_at,
      ends_at,
      client_name,
      client_phone,
      dog_name,
      dog_breed,
      dog_size,
      service,
      coat_state,
      temperament,
      notes,
      utm_source,
      utm_medium,
      utm_campaign,
      discount_code
  `;

  const row = result.rows[0];
  return row ? normalizeReservationRecord(row as Record<string, unknown>) : null;
}

