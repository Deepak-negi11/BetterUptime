-- 1. Add the column without the Unique constraint first
ALTER TABLE "user" ADD COLUMN email VARCHAR NOT NULL DEFAULT 'placeholder@example.com';
UPDATE "user" SET email = id || '@example.com' WHERE email = 'placeholder@example.com';

-- 3. Now that the data is unique, remove the default and add the index
ALTER TABLE "user" ALTER COLUMN email DROP DEFAULT;
CREATE UNIQUE INDEX user_email_idx ON "user" (email);