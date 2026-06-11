UPDATE "Customer"
SET "tags" = ARRAY[]::TEXT[]
WHERE "tags" IS NULL;
