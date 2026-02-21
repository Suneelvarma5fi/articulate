-- ============================================
-- INVITE CODES MIGRATION
-- Run this on Supabase SQL Editor before deploying
-- ============================================

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  created_by text REFERENCES users(clerk_user_id),
  max_uses integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- Add invite_code column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code text;

-- NOTE: We intentionally do NOT add a foreign key constraint from
-- users.invite_code to invite_codes.code here, because the admin
-- user may need to bypass invite codes. If you want the constraint:
-- ALTER TABLE users ADD CONSTRAINT fk_users_invite_code
--   FOREIGN KEY (invite_code) REFERENCES invite_codes(code);

-- Grant existing users an implicit invite code so they aren't locked out.
-- Run this ONCE after creating the table:
-- UPDATE users SET invite_code = 'LEGACY' WHERE invite_code IS NULL;
-- INSERT INTO invite_codes (code, max_uses, used_count, is_active)
--   VALUES ('LEGACY', 99999, (SELECT COUNT(*) FROM users), true);
