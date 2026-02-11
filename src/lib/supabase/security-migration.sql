-- ============================================
-- Security Hardening Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Atomic credit deduction function
-- Prevents double-spend race condition by using advisory locks
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id TEXT,
  p_amount NUMERIC
) RETURNS TABLE(success BOOLEAN, remaining NUMERIC) AS $$
DECLARE
  current_balance NUMERIC;
  lock_key BIGINT;
BEGIN
  -- Advisory lock keyed on user ID (blocks concurrent deductions for same user)
  lock_key := hashtext(p_user_id);
  PERFORM pg_advisory_xact_lock(lock_key);

  -- Get current balance
  SELECT COALESCE(SUM(ct.amount), 0) INTO current_balance
  FROM credit_transactions ct
  WHERE ct.clerk_user_id = p_user_id;

  -- Insufficient funds
  IF current_balance < p_amount THEN
    RETURN QUERY SELECT FALSE, current_balance;
    RETURN;
  END IF;

  -- Deduct
  INSERT INTO credit_transactions (clerk_user_id, amount, transaction_type, quality_level)
  VALUES (p_user_id, -p_amount, 'image_generation', 1);

  RETURN QUERY SELECT TRUE, current_balance - p_amount;
END;
$$ LANGUAGE plpgsql;

-- 2. Unique index on payment IDs to enforce idempotency at DB level
-- Partial index: only applies to non-NULL values (signup_bonus/generation rows have NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_payment_id_unique
ON credit_transactions (stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;
