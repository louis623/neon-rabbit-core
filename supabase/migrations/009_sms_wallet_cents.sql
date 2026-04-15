-- Migration 009: SMS Wallet — cents conversion, credit-only enum, auto-recharge lock, idempotent credit/deduct RPCs.
--
-- COMPATIBILITY BREAK (documented):
--   * Columns renamed on `sms_wallet`:
--       balance                   -> balance_cents                 INTEGER
--       auto_recharge_threshold   -> auto_recharge_threshold_cents INTEGER
--       auto_recharge_amount      -> auto_recharge_amount_cents    INTEGER
--       minimum_load_amount       -> minimum_load_amount_cents     INTEGER
--   * Columns renamed on `wallet_transactions`:
--       amount    -> amount_cents    INTEGER (unsigned; direction encoded in `type`)
--       stripe_fee -> stripe_fee_cents INTEGER NULL (NULL = fee unknown; never invent)
--   * Enum `wallet_transaction_type` rebuilt:
--       old: ('load','sms_charge','refund','adjustment')
--       new: ('load','sms_charge','refund','adjustment_credit','adjustment_debit','auto_recharge')
--     Legacy `adjustment` rows are split by sign (>=0 -> credit, <0 -> debit) before the type is dropped.
--
-- Known in-repo consumers that need updating alongside this migration:
--   - scripts/seed-test-rep.ts (updated in the same commit)
--   - CODEBASE_SNAPSHOT.md will drift until regenerated in a later task.
--
-- Fail-loud policy: pre-validation guards abort the migration on unexpected data (negative balances,
-- wrong-sign ledger rows, negative fees). We never silently coerce.

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Pre-validation guards — abort on anything unexpected.
-- -----------------------------------------------------------------------------
DO $$
DECLARE bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM sms_wallet
    WHERE balance IS NULL OR balance < 0
       OR auto_recharge_threshold IS NULL OR auto_recharge_threshold < 0
       OR auto_recharge_amount IS NULL OR auto_recharge_amount <= 0
       OR minimum_load_amount IS NULL OR minimum_load_amount <= 0;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Migration 009 aborted: sms_wallet has % rows violating nonneg/positive invariants', bad_count;
  END IF;

  SELECT COUNT(*) INTO bad_count FROM wallet_transactions
    WHERE amount IS NULL
       OR (type = 'sms_charge'::wallet_transaction_type AND amount >= 0)
       OR (type IN ('load'::wallet_transaction_type, 'refund'::wallet_transaction_type) AND amount <= 0)
       OR (stripe_fee IS NOT NULL AND stripe_fee < 0);
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Migration 009 aborted: wallet_transactions has % rows violating sign/fee invariants', bad_count;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Enum replacement — hard-remove `adjustment`, add explicit credit/debit + auto_recharge.
-- -----------------------------------------------------------------------------
CREATE TYPE wallet_transaction_type_new AS ENUM (
  'load',
  'sms_charge',
  'refund',
  'adjustment_credit',
  'adjustment_debit',
  'auto_recharge'
);

-- Convert the type column; split legacy 'adjustment' rows by sign of amount (still DECIMAL at this point).
ALTER TABLE wallet_transactions
  ALTER COLUMN type TYPE wallet_transaction_type_new
  USING (
    CASE
      WHEN type::text = 'adjustment' AND amount >= 0 THEN 'adjustment_credit'
      WHEN type::text = 'adjustment' AND amount <  0 THEN 'adjustment_debit'
      ELSE type::text
    END
  )::wallet_transaction_type_new;

DROP TYPE wallet_transaction_type;
ALTER TYPE wallet_transaction_type_new RENAME TO wallet_transaction_type;

-- -----------------------------------------------------------------------------
-- 2. sms_wallet — DECIMAL → INTEGER cents, add lock fields, add constraints.
-- -----------------------------------------------------------------------------
ALTER TABLE sms_wallet ADD COLUMN balance_cents INTEGER;
UPDATE sms_wallet SET balance_cents = ROUND(balance * 100)::INTEGER;
ALTER TABLE sms_wallet ALTER COLUMN balance_cents SET NOT NULL;
ALTER TABLE sms_wallet ALTER COLUMN balance_cents SET DEFAULT 0;
ALTER TABLE sms_wallet DROP COLUMN balance;
ALTER TABLE sms_wallet
  ADD CONSTRAINT sms_wallet_balance_nonneg CHECK (balance_cents >= 0);

ALTER TABLE sms_wallet ADD COLUMN auto_recharge_threshold_cents INTEGER;
UPDATE sms_wallet SET auto_recharge_threshold_cents = ROUND(auto_recharge_threshold * 100)::INTEGER;
ALTER TABLE sms_wallet ALTER COLUMN auto_recharge_threshold_cents SET NOT NULL;
ALTER TABLE sms_wallet ALTER COLUMN auto_recharge_threshold_cents SET DEFAULT 500;
ALTER TABLE sms_wallet DROP COLUMN auto_recharge_threshold;
ALTER TABLE sms_wallet
  ADD CONSTRAINT sms_wallet_threshold_nonneg CHECK (auto_recharge_threshold_cents >= 0);

ALTER TABLE sms_wallet ADD COLUMN auto_recharge_amount_cents INTEGER;
UPDATE sms_wallet SET auto_recharge_amount_cents = ROUND(auto_recharge_amount * 100)::INTEGER;
ALTER TABLE sms_wallet ALTER COLUMN auto_recharge_amount_cents SET NOT NULL;
ALTER TABLE sms_wallet ALTER COLUMN auto_recharge_amount_cents SET DEFAULT 2500;
ALTER TABLE sms_wallet DROP COLUMN auto_recharge_amount;
ALTER TABLE sms_wallet
  ADD CONSTRAINT sms_wallet_amount_min CHECK (auto_recharge_amount_cents >= 100);

ALTER TABLE sms_wallet ADD COLUMN minimum_load_amount_cents INTEGER;
UPDATE sms_wallet SET minimum_load_amount_cents = ROUND(minimum_load_amount * 100)::INTEGER;
ALTER TABLE sms_wallet ALTER COLUMN minimum_load_amount_cents SET NOT NULL;
ALTER TABLE sms_wallet ALTER COLUMN minimum_load_amount_cents SET DEFAULT 2500;
ALTER TABLE sms_wallet DROP COLUMN minimum_load_amount;
ALTER TABLE sms_wallet
  ADD CONSTRAINT sms_wallet_min_load_min CHECK (minimum_load_amount_cents >= 100);

ALTER TABLE sms_wallet
  ADD CONSTRAINT sms_wallet_amount_gt_threshold
  CHECK (auto_recharge_amount_cents > auto_recharge_threshold_cents);

-- Auto-recharge lock fields.
ALTER TABLE sms_wallet
  ADD COLUMN auto_recharge_pending BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN auto_recharge_attempt_id UUID;

-- -----------------------------------------------------------------------------
-- 3. wallet_transactions — unsigned cents, null-allowed fees, idempotency index.
-- -----------------------------------------------------------------------------
ALTER TABLE wallet_transactions ADD COLUMN amount_cents INTEGER;
UPDATE wallet_transactions SET amount_cents = ROUND(ABS(amount) * 100)::INTEGER;
ALTER TABLE wallet_transactions ALTER COLUMN amount_cents SET NOT NULL;
ALTER TABLE wallet_transactions DROP COLUMN amount;
ALTER TABLE wallet_transactions
  ADD CONSTRAINT wallet_tx_amount_positive CHECK (amount_cents > 0);

ALTER TABLE wallet_transactions ADD COLUMN stripe_fee_cents INTEGER;
UPDATE wallet_transactions
  SET stripe_fee_cents = ROUND(stripe_fee * 100)::INTEGER
  WHERE stripe_fee IS NOT NULL;
ALTER TABLE wallet_transactions DROP COLUMN stripe_fee;
ALTER TABLE wallet_transactions
  ADD CONSTRAINT wallet_tx_fee_nonneg
  CHECK (stripe_fee_cents IS NULL OR stripe_fee_cents >= 0);

CREATE UNIQUE INDEX idx_wallet_tx_stripe_pi_unique
  ON wallet_transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. RPC: deduct_wallet_balance — atomic debit + auto-recharge lock acquisition.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION deduct_wallet_balance(
  p_wallet_id UUID,
  p_amount    INTEGER
)
RETURNS TABLE(new_balance_cents INTEGER, should_recharge BOOLEAN, attempt_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet sms_wallet%ROWTYPE;
  v_new_balance INTEGER;
  v_attempt UUID := NULL;
  v_should BOOLEAN := false;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: p_amount must be a positive integer';
  END IF;

  SELECT * INTO v_wallet FROM sms_wallet WHERE id = p_wallet_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND: %', p_wallet_id;
  END IF;

  IF v_wallet.balance_cents - p_amount < 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS: balance=% amount=%', v_wallet.balance_cents, p_amount;
  END IF;

  v_new_balance := v_wallet.balance_cents - p_amount;

  -- Acquire auto-recharge lock atomically when threshold is crossed.
  IF v_new_balance <= v_wallet.auto_recharge_threshold_cents
     AND v_wallet.auto_recharge_enabled
     AND (
       NOT v_wallet.auto_recharge_pending
       OR v_wallet.updated_at < now() - interval '30 minutes'
     )
  THEN
    v_attempt := gen_random_uuid();
    v_should := true;
    UPDATE sms_wallet
      SET balance_cents = v_new_balance,
          auto_recharge_pending = true,
          auto_recharge_attempt_id = v_attempt,
          updated_at = now()
      WHERE id = p_wallet_id;
  ELSE
    UPDATE sms_wallet
      SET balance_cents = v_new_balance,
          updated_at = now()
      WHERE id = p_wallet_id;
  END IF;

  INSERT INTO wallet_transactions (wallet_id, type, amount_cents, description)
    VALUES (p_wallet_id, 'sms_charge', p_amount, 'SMS send');

  new_balance_cents := v_new_balance;
  should_recharge   := v_should;
  attempt_id        := v_attempt;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION deduct_wallet_balance(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION deduct_wallet_balance(UUID, INTEGER) TO service_role;

-- -----------------------------------------------------------------------------
-- 5. RPC: credit_wallet — idempotent credit with ownership check + credit-only allowlist.
--    Order of operations:
--      (a) lock wallet
--      (b) verify rep ownership (FAIL CLOSED before any ledger write)
--      (c) attempt ledger insert (ON CONFLICT DO NOTHING on stripe PI)
--      (d) only credit balance if ledger row was actually inserted
--      (e) clear auto-recharge lock only when p_type = 'auto_recharge' and attempt matches
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION credit_wallet(
  p_wallet_id   UUID,
  p_rep_id      UUID,
  p_amount      INTEGER,
  p_type        wallet_transaction_type,
  p_stripe_pi   TEXT,
  p_stripe_fee  INTEGER,
  p_description TEXT,
  p_attempt_id  UUID
)
RETURNS TABLE(new_balance_cents INTEGER, credited BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet sms_wallet%ROWTYPE;
  v_inserted_id UUID;
BEGIN
  IF p_type NOT IN ('load','auto_recharge','refund','adjustment_credit') THEN
    RAISE EXCEPTION 'INVALID_CREDIT_TYPE: %', p_type;
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: p_amount must be a positive integer';
  END IF;

  SELECT * INTO v_wallet FROM sms_wallet WHERE id = p_wallet_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND: %', p_wallet_id;
  END IF;

  IF v_wallet.rep_id <> p_rep_id THEN
    RAISE EXCEPTION 'WALLET_REP_MISMATCH: wallet=% rep=%', p_wallet_id, p_rep_id;
  END IF;

  -- Idempotent ledger insert — the unique partial index on stripe_payment_intent_id is the gate.
  INSERT INTO wallet_transactions
    (wallet_id, type, amount_cents, stripe_payment_intent_id, stripe_fee_cents, description)
  VALUES
    (p_wallet_id, p_type, p_amount, p_stripe_pi, p_stripe_fee, p_description)
  ON CONFLICT (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    new_balance_cents := v_wallet.balance_cents;
    credited          := false;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Credit the wallet; clear lock only for the matching auto-recharge attempt.
  IF p_type = 'auto_recharge'
     AND v_wallet.auto_recharge_attempt_id IS NOT NULL
     AND v_wallet.auto_recharge_attempt_id = p_attempt_id
  THEN
    UPDATE sms_wallet
      SET balance_cents = balance_cents + p_amount,
          last_loaded_at = now(),
          updated_at = now(),
          auto_recharge_pending = false,
          auto_recharge_attempt_id = NULL
      WHERE id = p_wallet_id
      RETURNING balance_cents INTO new_balance_cents;
  ELSE
    UPDATE sms_wallet
      SET balance_cents = balance_cents + p_amount,
          last_loaded_at = now(),
          updated_at = now()
      WHERE id = p_wallet_id
      RETURNING balance_cents INTO new_balance_cents;
  END IF;

  credited := true;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION credit_wallet(UUID, UUID, INTEGER, wallet_transaction_type, TEXT, INTEGER, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION credit_wallet(UUID, UUID, INTEGER, wallet_transaction_type, TEXT, INTEGER, TEXT, UUID) TO service_role;

-- -----------------------------------------------------------------------------
-- 6. RPC: release_wallet_recharge_lock — scoped by attempt_id; no-op if another attempt is live.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION release_wallet_recharge_lock(
  p_wallet_id  UUID,
  p_attempt_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE sms_wallet
    SET auto_recharge_pending = false,
        auto_recharge_attempt_id = NULL,
        updated_at = now()
    WHERE id = p_wallet_id
      AND auto_recharge_attempt_id = p_attempt_id;
END;
$$;

REVOKE ALL ON FUNCTION release_wallet_recharge_lock(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION release_wallet_recharge_lock(UUID, UUID) TO service_role;

COMMIT;
