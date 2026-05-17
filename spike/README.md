# Nic-Nac Cost Benchmark

Built for Phase 1 Task 1.0 Deliverable 7. Replaces the Gemini-report estimate
of $0.0017/message for Phase 1 budget modelling.

> Status: the `/spike` route was promoted to `/nic-nac` in Task 1.1. The
> benchmark driver now targets the production `/api/nic-nac` route and records
> the `x-nic-nac-run-id` response header for server-log correlation.

## Generation Approach

`prompts.json` is a hand-authored prompt pool that approximates a realistic
Nic-Nac conversation mix. Its current 21 prompts are close to the planned
60/30/10 split for conversational / read-tool / HITL prompts.

The driver expands that pool into the full Phase 1.0 benchmark shape:

- 100 cold prompts, each as turn 1 of a fresh conversation.
- 100 warm prompts, arranged as 20 conversations with 5 turns each.
- Warm conversations exclude HITL prompts because approval flows need a human
  approval response and would otherwise measure an approval stop, not a normal
  multi-turn assistant exchange.

The split is a planning baseline, not an empirical observation. Real rep
conversation distributions should be sampled from production logs after launch.

## Files

- `prompts.json` - hand-authored prompt pool. Each prompt has `{ kind, text }`
  where `kind` is one of `conversational`, `read`, or `hitl`.
- `run-benchmark.ts` - driver. Authenticates as the seeded test rep, sends the
  benchmark plan to `/api/nic-nac`, retries on 429 with exponential backoff,
  records per-prompt success, latency, and route run IDs, then writes
  `spike/benchmark-results-<timestamp>.json`.

## Running

Before running a serious benchmark, refetch current Anthropic pricing and
update the placeholder `PRICING` block in `run-benchmark.ts`.

```bash
# Defaults to NEXT_PUBLIC_APP_URL from .env.local, then http://localhost:3000.
# Use NIC_NAC_BENCHMARK_BASE_URL to force a deployed preview/production URL.
NIC_NAC_BENCHMARK_BASE_URL=https://sparkle-suite.vercel.app npx tsx spike/run-benchmark.ts

# Output: spike/benchmark-results-<timestamp>.json
```

Optional sizing overrides:

```bash
NIC_NAC_BENCHMARK_COLD_PROMPTS=10 NIC_NAC_BENCHMARK_WARM_CONVERSATIONS=2 NIC_NAC_BENCHMARK_WARM_TURNS=5 npx tsx spike/run-benchmark.ts
```

`SPIKE_BENCHMARK_BASE_URL` is still accepted as a legacy alias for the base URL.

## Token And Cost Accounting

The driver drains the SSE stream and records the `x-nic-nac-run-id` header for
each request. Authoritative token usage and cache accounting still come from
server-side `[nic-nac] streamText finish` log entries:

- `totalUsage.inputTokens`
- `totalUsage.outputTokens`
- `totalUsage.inputTokenDetails.cacheReadTokens`
- `totalUsage.inputTokenDetails.cacheWriteTokens`

Join the benchmark result file to the server logs by `runId` to produce final
cost aggregates. The local result file keeps token/USD fields nullable until
that join is done.

## Notes On Runtime

The original spike ran a lean sample rather than the full benchmark because the
org rate limit was 50,000 input tokens per minute. With a multi-thousand-token
system prompt, a full 200-prompt run can take 30-60 minutes with retry backoff.
Run it as a dedicated session, ideally off-peak or after a rate-limit increase.
