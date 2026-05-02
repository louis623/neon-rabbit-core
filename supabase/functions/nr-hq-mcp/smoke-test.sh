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
CREATED_TASK_KEY=""

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

# Call a tool and expect an MCP error payload. Stores raw response in $LAST_BODY.
call_tool_expect_error() {
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

  if [[ "$http_code" == "200" && $is_error -eq 1 ]]; then
    echo "✅ PASS  $label"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL  $label  (expected MCP error, http=$http_code)"
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

json_last_int() {     # $1 key
  unwrap_body | grep -oE "\"$1\"[[:space:]]*:[[:space:]]*[0-9]+" | tail -1 \
    | sed -E "s/^\"$1\"[[:space:]]*:[[:space:]]*([0-9]+)$/\1/"
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
# Build Tracker Task CRUD (real create/update flow)
# ─────────────────────────────────────────────────────────────────────────────
#
# Creates one smoke-test task in phase_0, verifies auto task_key/display_order,
# exercises duplicate/invalid input paths, then updates that task metadata and
# checks the audit log payload.

echo
echo "─── Build Tracker Task CRUD ─────────────────────────────────────────────"

call_tool "18.0 get_tasks (phase_0 baseline for display_order)" "get_tasks" \
  '{"phase_key":"phase_0","limit":200}'
BASELINE_TASK_COUNT="$(json_first_int count)"
BASELINE_MAX_DISPLAY_ORDER="$(json_last_int display_order)"
[[ -z "$BASELINE_TASK_COUNT" ]] && BASELINE_TASK_COUNT=0
[[ -z "$BASELINE_MAX_DISPLAY_ORDER" ]] && BASELINE_MAX_DISPLAY_ORDER=0

SMOKE_SUFFIX="$(date -u +%s)"
SMOKE_TASK_NUMBER="99.${SMOKE_SUFFIX}"
EXPECTED_SMOKE_TASK_KEY="task_99_${SMOKE_SUFFIX}"
UPDATED_SMOKE_TASK_NUMBER="100.${SMOKE_SUFFIX}"

call_tool "18   create_task (actor=codex, auto task_key/order)" "create_task" \
  "$(printf '{"phase_key":"phase_0","task_name":"SMOKE TASK %s","task_number":"%s","actor":"codex"}' "$SMOKE_SUFFIX" "$SMOKE_TASK_NUMBER")"

CREATED_TASK_KEY="$(json_first_str task_key)"
if [[ -z "$CREATED_TASK_KEY" ]]; then
  echo "❌ FAIL  18.1 capture created task_key"
  FAIL=$((FAIL + 1)); FAIL_NAMES+=("18.1")
else
  echo "   → captured task_key: $CREATED_TASK_KEY"
fi
assert_contains "$(unwrap_body)" "\"task_name\"[[:space:]]*:[[:space:]]*\"SMOKE TASK ${SMOKE_SUFFIX}\"" \
  "18.2 create_task returned created task"
if [[ "$CREATED_TASK_KEY" == "$EXPECTED_SMOKE_TASK_KEY" ]]; then
  echo "✅ PASS  18.3 auto-generated task_key format"
  PASS=$((PASS + 1))
else
  echo "❌ FAIL  18.3 expected task_key=$EXPECTED_SMOKE_TASK_KEY got=${CREATED_TASK_KEY:-<empty>}"
  FAIL=$((FAIL + 1)); FAIL_NAMES+=("18.3")
fi
CREATED_DISPLAY_ORDER="$(json_first_int display_order)"
if [[ -n "$CREATED_DISPLAY_ORDER" && "$CREATED_DISPLAY_ORDER" -eq $((BASELINE_MAX_DISPLAY_ORDER + 1)) ]]; then
  echo "✅ PASS  18.4 auto display_order slots after existing phase tasks"
  PASS=$((PASS + 1))
else
  echo "❌ FAIL  18.4 expected display_order=$((BASELINE_MAX_DISPLAY_ORDER + 1)) got=${CREATED_DISPLAY_ORDER:-<empty>}"
  FAIL=$((FAIL + 1)); FAIL_NAMES+=("18.4")
fi

call_tool "18.5 get_recent_audit_log (create_task audit)" "get_recent_audit_log" \
  "$(printf '{"target_type":"task","target_key":"%s","limit":1}' "$EXPECTED_SMOKE_TASK_KEY")"
UNWRAPPED="$(unwrap_body)"
assert_contains "$UNWRAPPED" "\"actor\"[[:space:]]*:[[:space:]]*\"codex\"" \
  "18.6 create_task audit actor=codex"
assert_contains "$UNWRAPPED" "\"entry_kind\"[[:space:]]*:[[:space:]]*\"audit\"" \
  "18.7 create_task audit entry_kind"

call_tool_expect_error "19   create_task duplicate task_key fails" "create_task" \
  "$(printf '{"phase_key":"phase_0","task_name":"SMOKE TASK DUP %s","task_number":"98.%s","task_key":"%s"}' "$SMOKE_SUFFIX" "$SMOKE_SUFFIX" "$EXPECTED_SMOKE_TASK_KEY")"
assert_contains "$(unwrap_body)" "Task key '$EXPECTED_SMOKE_TASK_KEY' already exists" \
  "19.1 duplicate task_key error message"

call_tool_expect_error "20   create_task invalid phase_key fails" "create_task" \
  "$(printf '{"phase_key":"phase_missing_%s","task_name":"bad","task_number":"97.%s"}' "$SMOKE_SUFFIX" "$SMOKE_SUFFIX")"
assert_contains "$(unwrap_body)" "Phase key 'phase_missing_${SMOKE_SUFFIX}' not found" \
  "20.1 invalid phase_key error message"

call_tool "21   update_task (rename + multi-field, actor=codex)" "update_task" \
  "$(printf '{"task_key":"%s","task_name":"SMOKE TASK UPDATED %s","task_number":"%s","execution_mode":"manual","assignee":"both","can_run_overnight":true,"time_estimate":"large","display_order":7,"actor":"codex"}' "$EXPECTED_SMOKE_TASK_KEY" "$SMOKE_SUFFIX" "$UPDATED_SMOKE_TASK_NUMBER")"
UNWRAPPED="$(unwrap_body)"
assert_contains "$UNWRAPPED" "\"task_name\"[[:space:]]*:[[:space:]]*\"SMOKE TASK UPDATED ${SMOKE_SUFFIX}\"" \
  "21.1 update_task renamed task"
assert_contains "$UNWRAPPED" "\"task_number\"[[:space:]]*:[[:space:]]*\"${UPDATED_SMOKE_TASK_NUMBER}\"" \
  "21.2 update_task changed task_number"
assert_contains "$UNWRAPPED" "\"execution_mode\"[[:space:]]*:[[:space:]]*\"manual\"" \
  "21.3 update_task changed execution_mode"
assert_contains "$UNWRAPPED" "\"assignee\"[[:space:]]*:[[:space:]]*\"both\"" \
  "21.4 update_task changed assignee"
assert_contains "$UNWRAPPED" "\"can_run_overnight\"[[:space:]]*:[[:space:]]*true" \
  "21.5 update_task changed can_run_overnight"
assert_contains "$UNWRAPPED" "\"time_estimate\"[[:space:]]*:[[:space:]]*\"large\"" \
  "21.6 update_task changed time_estimate"
assert_contains "$UNWRAPPED" "\"display_order\"[[:space:]]*:[[:space:]]*7" \
  "21.7 update_task changed display_order"

call_tool "21.8 get_recent_audit_log (update_task audit)" "get_recent_audit_log" \
  "$(printf '{"target_type":"task","target_key":"%s","limit":1}' "$EXPECTED_SMOKE_TASK_KEY")"
UNWRAPPED="$(unwrap_body)"
assert_contains "$UNWRAPPED" "\"actor\"[[:space:]]*:[[:space:]]*\"codex\"" \
  "21.9 update_task audit actor=codex"
assert_contains "$UNWRAPPED" "\"old_value\"[^\n]*task_name[^\n]*SMOKE TASK ${SMOKE_SUFFIX}" \
  "21.10 update_task audit old_value includes prior name"
assert_contains "$UNWRAPPED" "\"old_value\"[^\n]*task_number[^\n]*${SMOKE_TASK_NUMBER}" \
  "21.11 update_task audit old_value includes prior number"
assert_contains "$UNWRAPPED" "\"new_value\"[^\n]*task_name[^\n]*SMOKE TASK UPDATED ${SMOKE_SUFFIX}" \
  "21.12 update_task audit new_value includes updated name"
assert_contains "$UNWRAPPED" "\"new_value\"[^\n]*task_number[^\n]*${UPDATED_SMOKE_TASK_NUMBER}" \
  "21.13 update_task audit new_value includes updated number"
assert_contains "$UNWRAPPED" "\"new_value\"[^\n]*execution_mode[^\n]*manual" \
  "21.14 update_task audit new_value includes execution_mode"
assert_contains "$UNWRAPPED" "\"new_value\"[^\n]*assignee[^\n]*both" \
  "21.15 update_task audit new_value includes assignee"
assert_contains "$UNWRAPPED" "\"new_value\"[^\n]*can_run_overnight[^\n]*true" \
  "21.16 update_task audit new_value includes overnight flag"
assert_contains "$UNWRAPPED" "\"new_value\"[^\n]*time_estimate[^\n]*large" \
  "21.17 update_task audit new_value includes time estimate"
assert_contains "$UNWRAPPED" "\"new_value\"[^\n]*display_order[^\n]*7" \
  "21.18 update_task audit new_value includes display_order"

call_tool_expect_error "22   update_task no optional fields fails" "update_task" \
  "$(printf '{"task_key":"%s"}' "$EXPECTED_SMOKE_TASK_KEY")"
assert_contains "$(unwrap_body)" "At least one updatable field must be provided" \
  "22.1 update_task no-fields error message"

call_tool_expect_error "23   update_task invalid task_key fails" "update_task" \
  "$(printf '{"task_key":"task_missing_%s","task_name":"missing"}' "$SMOKE_SUFFIX")"
assert_contains "$(unwrap_body)" "Task not found: task_missing_${SMOKE_SUFFIX}" \
  "23.1 update_task invalid task_key error message"

call_tool "24   update_task_status (actor=codex)" "update_task_status" \
  "$(printf '{"task_key":"task_0_1","status":"complete","actor":"codex","notes":"smoke: codex actor acceptance %s"}' "$SMOKE_SUFFIX")"
call_tool "24.1 get_recent_audit_log (task_0_1 actor=codex)" "get_recent_audit_log" \
  '{"target_type":"task","target_key":"task_0_1","actor":"codex","limit":1}'
assert_contains "$(unwrap_body)" "\"actor\"[[:space:]]*:[[:space:]]*\"codex\"" \
  "24.2 update_task_status accepts actor=codex"

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
echo "      and target_key in ('task_0_1', '${EXPECTED_SMOKE_TASK_KEY}')"
echo "      and created_at >= '${SCRIPT_START_TS}';"
echo "  delete from public.construction_tasks where project = 'sparkle_suite' and task_key = '${EXPECTED_SMOKE_TASK_KEY}';"
echo

exit $FAIL
