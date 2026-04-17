#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# nr-hq-mcp smoke test — Memory Library Task 3
# ─────────────────────────────────────────────────────────────────────────────
# 14 curl calls against the deployed nr-hq-mcp endpoint:
#   - 2 baseline reads (confirms existing tools still work)
#   - 12 new write/CRUD tools
#
# USAGE:
#   export MCP_ACCESS_KEY='<paste-from-1Password>'
#   bash supabase/functions/nr-hq-mcp/smoke-test.sh
#
# DEPENDENCIES:
#   - curl
#   - grep, sed (standard POSIX — no jq required)
#
# TEST DATA:
#   - Open item:  title="SMOKE TEST — DELETE ME" (category=task, priority=low)
#   - Client:     name="SMOKE TEST CLIENT" (status=queued) — identified by uuid
#   - Build Tracker: no-op restores (writes current values back)
#
# CLEANUP (run in Supabase SQL Editor after all 14 tests pass):
#
#   delete from public.open_items where title = 'SMOKE TEST — DELETE ME';
#   delete from public.neon_rabbit_clients where name = 'SMOKE TEST CLIENT';
#
# ─────────────────────────────────────────────────────────────────────────────
set -u

: "${MCP_ACCESS_KEY:?MCP_ACCESS_KEY env var must be set — pull from 1Password and export}"
ENDPOINT="https://bqhzfkgkjyuhlsozpylf.supabase.co/functions/v1/nr-hq-mcp?key=${MCP_ACCESS_KEY}"

PASS=0
FAIL=0
FAIL_NAMES=()
CREATED_OPEN_ITEM_ID=""
CREATED_CLIENT_ID=""

# ─── helpers ─────────────────────────────────────────────────────────────────

# Call a tool. $1 = label, $2 = tool name, $3 = arguments JSON.
# Prints PASS/FAIL. Stores raw response in $LAST_BODY.
LAST_BODY=""
call_tool() {
  local label="$1" tool="$2" args="$3"
  local body http_code response
  body=$(printf '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"%s","arguments":%s}}' \
    "$tool" "$args")

  response=$(curl -s -w "\n__HTTP__%{http_code}" -X POST "$ENDPOINT" \
    -H "Accept: application/json, text/event-stream" \
    -H "Content-Type: application/json" \
    -d "$body")

  http_code=$(echo "$response" | tail -n1 | sed 's/^__HTTP__//')
  LAST_BODY=$(echo "$response" | sed '$d')

  local is_error=0
  if echo "$LAST_BODY" | grep -q '"isError":[[:space:]]*true'; then is_error=1; fi
  if echo "$LAST_BODY" | grep -q '"error":[[:space:]]*{'; then is_error=1; fi

  if [[ "$http_code" == "200" && $is_error -eq 0 ]]; then
    echo "✅ PASS  $label"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL  $label  (http=$http_code)"
    echo "   body: $LAST_BODY"
    FAIL=$((FAIL + 1))
    FAIL_NAMES+=("$label")
  fi
}

# Grab the first UUID appearing in the last response.
# For create_* tools, this is the id of the just-created row.
extract_first_uuid() {
  echo "$LAST_BODY" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1
}

# MCP responses embed a JSON payload inside a "text" string field, so keys in
# the inner payload appear as \"key\":\"value\" in $LAST_BODY. Unwrap the
# JSON-string escaping so grep/sed patterns can match the inner JSON directly.
unwrap_body() {
  # shellcheck disable=SC1003  # we want a literal backslash
  echo "$LAST_BODY" | sed 's/\\"/"/g; s/\\n/ /g'
}

assert_contains() {   # $1 body, $2 regex, $3 label
  if echo "$1" | grep -qE "$2"; then
    echo "✅ PASS  $3"; PASS=$((PASS + 1))
  else
    echo "❌ FAIL  $3"; echo "   regex: $2"
    FAIL=$((FAIL + 1)); FAIL_NAMES+=("$3")
  fi
}

# Extract the first JSON integer value of a given key from the (unwrapped) LAST_BODY.
json_first_int() {    # $1 key
  unwrap_body | grep -oE "\"$1\"[[:space:]]*:[[:space:]]*[0-9]+" | head -1 \
    | sed -E "s/^\"$1\"[[:space:]]*:[[:space:]]*([0-9]+)$/\1/"
}

# Extract the first JSON string value of a given key from the (unwrapped) LAST_BODY.
# Value must not contain double-quotes.
json_first_str() {    # $1 key
  unwrap_body | grep -oE "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 \
    | sed -E "s/^\"$1\"[[:space:]]*:[[:space:]]*\"(.*)\"$/\1/"
}

# ─────────────────────────────────────────────────────────────────────────────
# Baseline reads (2)
# ─────────────────────────────────────────────────────────────────────────────

echo "─── Baseline reads ───────────────────────────────────────────────────"

call_tool "01  get_build_summary"   "get_build_summary"   '{}'
call_tool "02  get_phases"          "get_phases"          '{"limit":5}'

# ─────────────────────────────────────────────────────────────────────────────
# Open Items CRUD (create → update → resolve → get)
# ─────────────────────────────────────────────────────────────────────────────

echo "─── Open Items CRUD ──────────────────────────────────────────────────"

call_tool "03  create_open_item"    "create_open_item" \
  '{"title":"SMOKE TEST — DELETE ME","category":"task","priority":"low","description":"initial"}'

CREATED_OPEN_ITEM_ID=$(extract_first_uuid)
if [[ -z "$CREATED_OPEN_ITEM_ID" ]]; then
  echo "⚠  Could not extract created open_item id — update/resolve tests will be skipped."
  echo "❌ FAIL  04  update_open_item  (no id captured)"; FAIL=$((FAIL+1)); FAIL_NAMES+=("04")
  echo "❌ FAIL  05  resolve_open_item (no id captured)"; FAIL=$((FAIL+1)); FAIL_NAMES+=("05")
else
  echo "   → captured open_item id: $CREATED_OPEN_ITEM_ID"

  call_tool "04  update_open_item"    "update_open_item" \
    "$(printf '{"id":"%s","description":"updated by smoke test"}' "$CREATED_OPEN_ITEM_ID")"

  call_tool "05  resolve_open_item"   "resolve_open_item" \
    "$(printf '{"id":"%s","resolution":"smoke test cleanup"}' "$CREATED_OPEN_ITEM_ID")"
fi

call_tool "06  get_open_items"      "get_open_items" \
  '{"status":"resolved"}'

# ─────────────────────────────────────────────────────────────────────────────
# Clients CRUD (create → update → get → get_clients)
# Schema (per Decision 10): id (uuid) is the unique key. No `code` column.
# Writable: name, site_name, site_url, status, tier, mrr, started_at,
#           launched_at, notes, user_id.
# No updated_at column exists.
# ─────────────────────────────────────────────────────────────────────────────

echo "─── Clients CRUD ─────────────────────────────────────────────────────"

# user_id is NOT NULL at DB level — reuse the existing owner uuid visible on every
# live row in get_clients. If that uuid changes, update here.
SMOKE_CLIENT_USER_ID="40ddb0a2-6de7-494b-b0b6-22cbfc41fd36"
call_tool "07  create_client"       "create_client" \
  "$(printf '{"name":"SMOKE TEST CLIENT","user_id":"%s","status":"queued","notes":"smoke test row"}' "$SMOKE_CLIENT_USER_ID")"

CREATED_CLIENT_ID=$(extract_first_uuid)
if [[ -z "$CREATED_CLIENT_ID" ]]; then
  echo "⚠  Could not extract created client id — update/get tests will be skipped."
  echo "❌ FAIL  08  update_client  (no id captured)"; FAIL=$((FAIL+1)); FAIL_NAMES+=("08")
  echo "❌ FAIL  09  get_client     (no id captured)"; FAIL=$((FAIL+1)); FAIL_NAMES+=("09")
else
  echo "   → captured client id: $CREATED_CLIENT_ID"

  call_tool "08  update_client"     "update_client" \
    "$(printf '{"id":"%s","notes":"updated smoke note","mrr":49}' "$CREATED_CLIENT_ID")"

  call_tool "09  get_client"        "get_client" \
    "$(printf '{"id":"%s"}' "$CREATED_CLIENT_ID")"
fi

call_tool "10  get_clients"         "get_clients" \
  '{"status":"queued"}'

# ─────────────────────────────────────────────────────────────────────────────
# Build Tracker (real data, no-op restores)
# ─────────────────────────────────────────────────────────────────────────────

echo "─── Build Tracker (no-op restores) ───────────────────────────────────"

# update_task_status — target phase_0 task_0.1 (real task known to exist in sparkle_suite).
# Use status='complete' no-op; if the real task is already complete this is a pure no-op.
call_tool "11  update_task_status"  "update_task_status" \
  '{"task_key":"task_0_1","status":"complete","notes":"smoke: no-op restore"}'

# update_phase_status — no-op phase_0 → in_progress (or use current value). This also
# triggers the count recompute.
call_tool "12  update_phase_status" "update_phase_status" \
  '{"phase_key":"phase_0","status":"in_progress"}'

# update_gate_status — no-op gate_0 → locked (or current value).
call_tool "13  update_gate_status"  "update_gate_status" \
  '{"gate_key":"gate_0","status":"locked"}'

# update_action_cards — write back placeholder cards. After smoke test, Louis should
# either read the 3 cards before running this script (and put them in the JSON below)
# or run update_action_cards manually from Claude Chat to restore real content.
call_tool "14  update_action_cards" "update_action_cards" \
  '{"previous":{"title":"SMOKE PREVIOUS","description":"replace me"},"current":{"title":"SMOKE CURRENT","description":"replace me"},"next":{"title":"SMOKE NEXT","description":"replace me"}}'

echo
echo "⚠  NOTE: update_action_cards writes 3 placeholder cards. Restore real"
echo "    cards via Claude Chat (update_action_cards) or SQL after smoke test."

# ─────────────────────────────────────────────────────────────────────────────
# Audit-log coverage (tests 15–17) — Memory Library Task 4 Part A
# ─────────────────────────────────────────────────────────────────────────────
#
# Exercises the build_action_log audit-write path introduced by migration 013.
# Strategy: flip task_0_1 to a dynamically-chosen non-complete status, verify
# a new row in entry_kind='audit'; no-op at that non-complete state and verify
# NO row written; revert to original status and verify a second audit row with
# swapped old/new. Self-contained: original status is captured and restored.

echo
echo "─── Audit log coverage (tests 15–17) ────────────────────────────────"
SCRIPT_START_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# 15.0 — Pre-read current status of task_0_1 from get_tasks; pick a non-complete flip target.
call_tool "15.0 get_tasks (read task_0_1 current status)" "get_tasks" \
  '{"phase_key":"phase_0","limit":50}'
ORIG_STATUS="$(unwrap_body \
  | awk '/"task_key":[ \t]*"task_0_1"/,/\}/' \
  | grep -oE '"status":[ \t]*"[^"]+"' | head -1 \
  | sed -E 's/.*"([^"]+)"$/\1/')"

if [[ -z "$ORIG_STATUS" ]]; then
  echo "❌ FAIL  15.0 could not extract task_0_1 current status — tests 15–17 skipped"
  FAIL=$((FAIL + 1)); FAIL_NAMES+=("15.0")
else
  echo "   → task_0_1 current status: $ORIG_STATUS"
  # Non-complete pool; first entry != ORIG_STATUS wins. Guarantees FLIP_STATUS is never
  # 'complete' so the test 16 no-op doesn't trigger auto completion_date aliasing.
  FLIP_STATUS=""
  for cand in in_progress not_started blocked; do
    if [[ "$cand" != "$ORIG_STATUS" ]]; then FLIP_STATUS="$cand"; break; fi
  done
  echo "   → flip target: $FLIP_STATUS (non-complete)"

  # Baseline audit row count for this target.
  call_tool "15.1 get_recent_audit_log (baseline count)" "get_recent_audit_log" \
    '{"target_type":"task","target_key":"task_0_1","limit":200}'
  BASE_COUNT="$(json_first_int count)"
  [[ -z "$BASE_COUNT" ]] && BASE_COUNT=0
  echo "   → baseline audit count: $BASE_COUNT"

  # ── Test 15: flip ORIG → FLIP_STATUS with actor='chat' ─────────────────────
  call_tool "15   update_task_status (flip, actor=chat)" "update_task_status" \
    "$(printf '{"task_key":"task_0_1","status":"%s","actor":"chat"}' "$FLIP_STATUS")"

  call_tool "15.2 get_recent_audit_log (post-flip, limit=1)" "get_recent_audit_log" \
    '{"target_type":"task","target_key":"task_0_1","limit":1}'
  UNWRAPPED="$(unwrap_body)"
  assert_contains "$UNWRAPPED" "\"actor\"[[:space:]]*:[[:space:]]*\"chat\""              "15.3 audit actor=chat"
  assert_contains "$UNWRAPPED" "\"entry_kind\"[[:space:]]*:[[:space:]]*\"audit\""        "15.4 audit entry_kind=audit"
  assert_contains "$UNWRAPPED" "\"new_value\"[[:space:]]*:[[:space:]]*\"$FLIP_STATUS\""  "15.5 audit new_value=$FLIP_STATUS"
  assert_contains "$UNWRAPPED" "\"old_value\"[[:space:]]*:[[:space:]]*\"$ORIG_STATUS\""  "15.6 audit old_value=$ORIG_STATUS"

  call_tool "15.7 get_recent_audit_log (count +1 check)" "get_recent_audit_log" \
    '{"target_type":"task","target_key":"task_0_1","limit":200}'
  AFTER_FLIP_COUNT="$(json_first_int count)"
  if [[ "$AFTER_FLIP_COUNT" -eq $((BASE_COUNT + 1)) ]]; then
    echo "✅ PASS  15.8 count delta = +1"; PASS=$((PASS + 1))
  else
    echo "❌ FAIL  15.8 expected +1, got $((AFTER_FLIP_COUNT - BASE_COUNT))"
    FAIL=$((FAIL + 1)); FAIL_NAMES+=("15.8")
  fi

  # ── Test 16: no-op at FLIP_STATUS — no audit row expected ─────────────────
  call_tool "16   update_task_status (no-op at FLIP_STATUS)" "update_task_status" \
    "$(printf '{"task_key":"task_0_1","status":"%s"}' "$FLIP_STATUS")"
  call_tool "16.1 get_recent_audit_log (no-op count check)" "get_recent_audit_log" \
    '{"target_type":"task","target_key":"task_0_1","limit":200}'
  AFTER_NOOP_COUNT="$(json_first_int count)"
  if [[ "$AFTER_NOOP_COUNT" -eq "$AFTER_FLIP_COUNT" ]]; then
    echo "✅ PASS  16.2 no-op wrote no audit row (delta=0)"; PASS=$((PASS + 1))
  else
    echo "❌ FAIL  16.2 no-op delta (expected 0, got $((AFTER_NOOP_COUNT - AFTER_FLIP_COUNT)))"
    FAIL=$((FAIL + 1)); FAIL_NAMES+=("16.2")
  fi

  # ── Test 17: revert FLIP_STATUS → ORIG_STATUS with actor='claude_code' ────
  call_tool "17   update_task_status (revert, actor=claude_code)" "update_task_status" \
    "$(printf '{"task_key":"task_0_1","status":"%s","actor":"claude_code"}' "$ORIG_STATUS")"
  call_tool "17.1 get_recent_audit_log (post-revert, limit=1)" "get_recent_audit_log" \
    '{"target_type":"task","target_key":"task_0_1","limit":1}'
  UNWRAPPED="$(unwrap_body)"
  assert_contains "$UNWRAPPED" "\"actor\"[[:space:]]*:[[:space:]]*\"claude_code\""       "17.2 audit actor=claude_code"
  assert_contains "$UNWRAPPED" "\"old_value\"[[:space:]]*:[[:space:]]*\"$FLIP_STATUS\""  "17.3 audit old_value=$FLIP_STATUS"
  assert_contains "$UNWRAPPED" "\"new_value\"[[:space:]]*:[[:space:]]*\"$ORIG_STATUS\""  "17.4 audit new_value=$ORIG_STATUS"

  call_tool "17.5 get_recent_audit_log (count +2 check)" "get_recent_audit_log" \
    '{"target_type":"task","target_key":"task_0_1","limit":200}'
  FINAL_COUNT="$(json_first_int count)"
  if [[ "$FINAL_COUNT" -eq $((BASE_COUNT + 2)) ]]; then
    echo "✅ PASS  17.6 final count delta = +2"; PASS=$((PASS + 1))
  else
    echo "❌ FAIL  17.6 expected +2, got $((FINAL_COUNT - BASE_COUNT))"
    FAIL=$((FAIL + 1)); FAIL_NAMES+=("17.6")
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────

echo
echo "═══════════════════════════════════════════════════════════════════════"
echo "  Results: ${PASS} PASS   ${FAIL} FAIL"
if [[ $FAIL -gt 0 ]]; then
  echo "  Failed: ${FAIL_NAMES[*]}"
fi
echo "═══════════════════════════════════════════════════════════════════════"
echo
echo "CLEANUP (Supabase SQL Editor):"
echo "  delete from public.open_items where title = 'SMOKE TEST — DELETE ME';"
echo "  delete from public.neon_rabbit_clients where name = 'SMOKE TEST CLIENT';"
echo "  delete from public.build_action_log"
echo "    where entry_kind = 'audit'"
echo "      and target_type = 'task'"
echo "      and target_key = 'task_0_1'"
echo "      and created_at >= '${SCRIPT_START_TS}';"
echo

exit $FAIL
