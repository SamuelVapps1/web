import { readFileSync } from 'node:fs';
import { sql } from '@vercel/postgres';

const schemaPath = new URL('./schema.sql', import.meta.url);
const schema = readFileSync(schemaPath, 'utf8');

const statements = schema
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Applied ${statements.length} statements from schema.sql`);

