-- Sparkle Suite wallet units migration
-- Why: the locked SMS rate is $0.009/text, which cannot be represented exactly
-- with integer cents. We keep money-safety by storing wallet values in integer
-- thousandths of a dollar ("mils") instead.

BEGIN;

ALTER TABLE sms_wallet RENAME COLUMN balance_cents TO balance_mils;
ALTER TABLE sms_wallet RENAME COLUMN auto_recharge_threshold_cents TO auto_recharge_threshold_mils;
ALTER TABLE sms_wallet RENAME COLUMN auto_recharge_amount_cents TO auto_recharge_amount_mils;
ALTER TABLE sms_wallet RENAME COLUMN minimum_load_amount_cents TO minimum_load_amount_mils;

UPDATE sms_wallet
SET
  balance_mils = balance_mils * 10,
  auto_recharge_threshold_mils = auto_recharge_threshold_mils * 10,
  auto_recharge_amount_mils = auto_recharge_amount_mils * 10,
  minimum_load_amount_mils = minimum_load_amount_mils * 10;

ALTER TABLE wallet_transactions RENAME COLUMN amount_cents TO amount_mils;
ALTER TABLE wallet_transactions RENAME COLUMN stripe_fee_cents TO stripe_fee_mils;

UPDATE wallet_transactions
SET
  amount_mils = amount_mils * 10,
  stripe_fee_mils = CASE
    WHEN stripe_fee_mils IS NULL THEN NULL
    ELSE stripe_fee_mils * 10
  END;

DROP FUNCTION IF EXISTS deduct_wallet_balance(UUID, INTEGER);

CREATE FUNCTION deduct_wallet_balance(
  p_wallet_id UUID,
  p_amount    INTEGER
)
RETURNS TABLE(new_balance_mils INTEGER, should_recharge BOOLEAN, attempt_id UUID)
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

  IF v_wallet.balance_mils - p_amount < 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS: balance=% amount=%', v_wallet.balance_mils, p_amount;
  END IF;

  v_new_balance := v_wallet.balance_mils - p_amount;

  IF v_new_balance <= v_wallet.auto_recharge_threshold_mils
     AND v_wallet.auto_recharge_enabled
     AND (
       NOT v_wallet.auto_recharge_pending
       OR v_wallet.updated_at < now() - interval '30 minutes'
     )
  THEN
    v_attempt := gen_random_uuid();
    v_should := true;
    UPDATE sms_wallet
      SET balance_mils = v_new_balance,
          auto_recharge_pending = true,
          auto_recharge_attempt_id = v_attempt,
          updated_at = now()
      WHERE id = p_wallet_id;
  ELSE
    UPDATE sms_wallet
      SET balance_mils = v_new_balance,
          updated_at = now()
      WHERE id = p_wallet_id;
  END IF;

  INSERT INTO wallet_transactions (wallet_id, type, amount_mils, description)
    VALUES (p_wallet_id, 'sms_charge', p_amount, 'SMS send');

  new_balance_mils := v_new_balance;
  should_recharge  := v_should;
  attempt_id       := v_attempt;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION deduct_wallet_balance(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION deduct_wallet_balance(UUID, INTEGER) TO service_role;

DROP FUNCTION IF EXISTS credit_wallet(UUID, UUID, INTEGER, wallet_transaction_type, TEXT, INTEGER, TEXT, UUID);

CREATE FUNCTION credit_wallet(
  p_wallet_id   UUID,
  p_rep_id      UUID,
  p_amount      INTEGER,
  p_type        wallet_transaction_type,
  p_stripe_pi   TEXT,
  p_stripe_fee  INTEGER,
  p_description TEXT,
  p_attempt_id  UUID
)
RETURNS TABLE(new_balance_mils INTEGER, credited BOOLEAN)
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

  INSERT INTO wallet_transactions
    (wallet_id, type, amount_mils, stripe_payment_intent_id, stripe_fee_mils, description)
  VALUES
    (p_wallet_id, p_type, p_amount, p_stripe_pi, p_stripe_fee, p_description)
  ON CONFLICT (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    new_balance_mils := v_wallet.balance_mils;
    credited         := false;
    RETURN NEXT;
    RETURN;
  END IF;

  IF p_type = 'auto_recharge'
     AND v_wallet.auto_recharge_attempt_id IS NOT NULL
     AND v_wallet.auto_recharge_attempt_id = p_attempt_id
  THEN
    UPDATE sms_wallet
      SET balance_mils = balance_mils + p_amount,
          last_loaded_at = now(),
          updated_at = now(),
          auto_recharge_pending = false,
          auto_recharge_attempt_id = NULL
      WHERE id = p_wallet_id
      RETURNING balance_mils INTO new_balance_mils;
  ELSE
    UPDATE sms_wallet
      SET balance_mils = balance_mils + p_amount,
          last_loaded_at = now(),
          updated_at = now()
      WHERE id = p_wallet_id
      RETURNING balance_mils INTO new_balance_mils;
  END IF;

  credited := true;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION credit_wallet(UUID, UUID, INTEGER, wallet_transaction_type, TEXT, INTEGER, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION credit_wallet(UUID, UUID, INTEGER, wallet_transaction_type, TEXT, INTEGER, TEXT, UUID) TO service_role;

COMMIT;
