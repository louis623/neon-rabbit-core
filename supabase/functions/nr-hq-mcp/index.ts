import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono } from "hono";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const MCP_ACCESS_KEY = Deno.env.get("MCP_ACCESS_KEY")!;
const DEFAULT_PROJECT = Deno.env.get("NR_HQ_DEFAULT_PROJECT") ?? "sparkle_suite";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Enum constants — mirror CHECK constraints in migration-008 + migration-010.
const PHASE_STATUSES   = ["not_started", "in_progress", "testing", "complete"] as const;
const TASK_STATUSES    = ["not_started", "in_progress", "complete", "blocked"] as const;
const EXECUTION_MODES  = ["ultraplan", "standard", "claude_chat", "manual"] as const;
const ASSIGNEES        = ["claude_code", "louis", "both", "opus_chat"] as const;
const GATE_STATUSES    = ["locked", "testing", "passed", "failed"] as const;
const CARD_POSITIONS   = ["previous", "current", "next"] as const;

type Envelope = Record<string, unknown>;

function textResult(obj: Envelope) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(obj, null, 2) },
    ],
  };
}

function errorResult(msg: string) {
  return {
    content: [{ type: "text" as const, text: `Error: ${msg}` }],
    isError: true,
  };
}

function hasMore(offset: number, returned: number, total: number | null) {
  if (total === null) return false;
  return offset + returned < total;
}

// --- MCP Server ---

const server = new McpServer({
  name: "nr-hq",
  version: "1.0.0",
});

// Tool: get_phases
server.registerTool(
  "get_phases",
  {
    title: "Get Build Phases",
    description:
      "List construction phases for a project, ordered by display_order. Supports optional status filter and pagination.",
    inputSchema: {
      project: z.string().min(1).max(128).optional().describe("Project id (default: sparkle_suite)"),
      status: z.enum(PHASE_STATUSES).optional(),
      limit: z.number().int().min(1).max(200).optional().default(50),
      offset: z.number().int().min(0).optional().default(0),
    },
  },
  async ({ project, status, limit, offset }) => {
    try {
      const p = project ?? DEFAULT_PROJECT;
      let q = supabase
        .from("construction_phases")
        .select(
          "id, project, phase_number, phase_key, phase_name, status, total_tasks, completed_tasks, display_order, updated_at",
          { count: "exact" }
        )
        .eq("project", p)
        .order("display_order", { ascending: true })
        .range(offset, offset + limit - 1);
      if (status) q = q.eq("status", status);
      const { data, error, count } = await q;
      if (error) return errorResult(error.message);
      const rows = data ?? [];
      return textResult({
        project: p,
        limit,
        offset,
        count: count ?? rows.length,
        has_more: hasMore(offset, rows.length, count ?? null),
        phases: rows,
      });
    } catch (err) {
      return errorResult((err as Error).message);
    }
  }
);

// Tool: get_tasks
server.registerTool(
  "get_tasks",
  {
    title: "Get Build Tasks",
    description:
      "List construction tasks for a project with optional filters (phase_id, phase_key, status, execution_mode, assignee, overnight_only). Ordered by display_order.",
    inputSchema: {
      project: z.string().min(1).max(128).optional(),
      phase_id: z.string().uuid().optional(),
      phase_key: z.string().min(1).max(128).optional().describe("Resolved to phase_id via prefetch if phase_id not supplied"),
      status: z.enum(TASK_STATUSES).optional(),
      execution_mode: z.enum(EXECUTION_MODES).optional(),
      assignee: z.enum(ASSIGNEES).optional(),
      overnight_only: z.boolean().optional(),
      limit: z.number().int().min(1).max(200).optional().default(50),
      offset: z.number().int().min(0).optional().default(0),
    },
  },
  async ({ project, phase_id, phase_key, status, execution_mode, assignee, overnight_only, limit, offset }) => {
    try {
      const p = project ?? DEFAULT_PROJECT;

      let resolvedPhaseId = phase_id ?? null;
      if (!resolvedPhaseId && phase_key) {
        const { data: ph, error: phErr } = await supabase
          .from("construction_phases")
          .select("id")
          .eq("project", p)
          .eq("phase_key", phase_key)
          .maybeSingle();
        if (phErr) return errorResult(phErr.message);
        if (!ph) {
          return textResult({
            project: p, limit, offset, count: 0, has_more: false, tasks: [],
          });
        }
        resolvedPhaseId = ph.id as string;
      }

      let q = supabase
        .from("construction_tasks")
        .select(
          "id, project, phase_id, task_number, task_key, task_name, status, execution_mode, assignee, can_run_overnight, time_estimate, completion_session, completion_date, notes, display_order, updated_at",
          { count: "exact" }
        )
        .eq("project", p)
        .order("display_order", { ascending: true })
        .range(offset, offset + limit - 1);
      if (resolvedPhaseId) q = q.eq("phase_id", resolvedPhaseId);
      if (status) q = q.eq("status", status);
      if (execution_mode) q = q.eq("execution_mode", execution_mode);
      if (assignee) q = q.eq("assignee", assignee);
      if (overnight_only) q = q.eq("can_run_overnight", true);
      const { data, error, count } = await q;
      if (error) return errorResult(error.message);
      const rows = data ?? [];
      return textResult({
        project: p,
        limit,
        offset,
        count: count ?? rows.length,
        has_more: hasMore(offset, rows.length, count ?? null),
        tasks: rows,
      });
    } catch (err) {
      return errorResult((err as Error).message);
    }
  }
);

// Tool: get_gates
server.registerTool(
  "get_gates",
  {
    title: "Get Test Gates",
    description:
      "List test gates for a project, ordered by display_order. Set include_items=true to include the raw JSONB checklist.",
    inputSchema: {
      project: z.string().min(1).max(128).optional(),
      phase_id: z.string().uuid().optional(),
      status: z.enum(GATE_STATUSES).optional(),
      include_items: z.boolean().optional().default(false),
      limit: z.number().int().min(1).max(200).optional().default(50),
      offset: z.number().int().min(0).optional().default(0),
    },
  },
  async ({ project, phase_id, status, include_items, limit, offset }) => {
    try {
      const p = project ?? DEFAULT_PROJECT;
      const cols = include_items
        ? "id, project, phase_id, gate_key, gate_name, status, items, display_order, updated_at"
        : "id, project, phase_id, gate_key, gate_name, status, display_order, updated_at";
      let q = supabase
        .from("construction_gates")
        .select(cols, { count: "exact" })
        .eq("project", p)
        .order("display_order", { ascending: true })
        .range(offset, offset + limit - 1);
      if (phase_id) q = q.eq("phase_id", phase_id);
      if (status) q = q.eq("status", status);
      const { data, error, count } = await q;
      if (error) return errorResult(error.message);
      const rows = data ?? [];
      return textResult({
        project: p,
        limit,
        offset,
        count: count ?? rows.length,
        has_more: hasMore(offset, rows.length, count ?? null),
        gates: rows,
      });
    } catch (err) {
      return errorResult((err as Error).message);
    }
  }
);

// Tool: get_action_cards
server.registerTool(
  "get_action_cards",
  {
    title: "Get Rolling Action Cards",
    description:
      "Return the 3 active action cards (previous / current / next) for a project. Missing positions return null. Archived rows (is_active=false) are excluded.",
    inputSchema: {
      project: z.string().min(1).max(128).optional(),
      position: z.enum(CARD_POSITIONS).optional(),
    },
  },
  async ({ project, position }) => {
    try {
      const p = project ?? DEFAULT_PROJECT;
      let q = supabase
        .from("build_action_log")
        .select("id, project, position, title, description, is_active, created_at, updated_at")
        .eq("project", p)
        .eq("is_active", true);
      if (position) q = q.eq("position", position);
      const { data, error } = await q;
      if (error) return errorResult(error.message);
      const cards: Record<string, unknown> = { previous: null, current: null, next: null };
      for (const row of data ?? []) {
        cards[(row as { position: string }).position] = row;
      }
      return textResult({ project: p, cards });
    } catch (err) {
      return errorResult((err as Error).message);
    }
  }
);

// Tool: get_build_summary
server.registerTool(
  "get_build_summary",
  {
    title: "Get Build Summary",
    description:
      "High-level rollup for a project: phase/task/gate counts by status, execution mode, assignee, plus active action cards. Compares cached phase rollups against derived task counts and flags drift.",
    inputSchema: {
      project: z.string().min(1).max(128).optional(),
    },
  },
  async ({ project }) => {
    try {
      const p = project ?? DEFAULT_PROJECT;
      const [phasesRes, tasksRes, gatesRes, cardsRes] = await Promise.all([
        supabase.from("construction_phases").select("status, total_tasks, completed_tasks").eq("project", p),
        supabase.from("construction_tasks").select("status, execution_mode, assignee, can_run_overnight").eq("project", p),
        supabase.from("construction_gates").select("status").eq("project", p),
        supabase.from("build_action_log").select("position, title, description").eq("project", p).eq("is_active", true),
      ]);
      const firstErr = phasesRes.error ?? tasksRes.error ?? gatesRes.error ?? cardsRes.error;
      if (firstErr) return errorResult(firstErr.message);

      const phaseRows = phasesRes.data ?? [];
      const taskRows = tasksRes.data ?? [];
      const gateRows = gatesRes.data ?? [];
      const cardRows = cardsRes.data ?? [];

      const phaseByStatus: Record<string, number> = Object.fromEntries(PHASE_STATUSES.map((s) => [s, 0]));
      let cachedTotal = 0;
      let cachedDone = 0;
      for (const r of phaseRows) {
        const row = r as { status: string; total_tasks: number; completed_tasks: number };
        phaseByStatus[row.status] = (phaseByStatus[row.status] ?? 0) + 1;
        cachedTotal += row.total_tasks ?? 0;
        cachedDone += row.completed_tasks ?? 0;
      }

      const taskByStatus: Record<string, number> = Object.fromEntries(TASK_STATUSES.map((s) => [s, 0]));
      const taskByMode: Record<string, number> = Object.fromEntries(EXECUTION_MODES.map((m) => [m, 0]));
      const taskByAssignee: Record<string, number> = Object.fromEntries(ASSIGNEES.map((a) => [a, 0]));
      let overnight = 0;
      for (const r of taskRows) {
        const row = r as { status: string; execution_mode: string; assignee: string | null; can_run_overnight: boolean };
        taskByStatus[row.status] = (taskByStatus[row.status] ?? 0) + 1;
        taskByMode[row.execution_mode] = (taskByMode[row.execution_mode] ?? 0) + 1;
        const a = row.assignee ?? "unknown";
        taskByAssignee[a] = (taskByAssignee[a] ?? 0) + 1;
        if (row.can_run_overnight) overnight++;
      }
      const derivedTotal = taskRows.length;
      const derivedDone = taskByStatus["complete"] ?? 0;

      const gateByStatus: Record<string, number> = Object.fromEntries(GATE_STATUSES.map((s) => [s, 0]));
      for (const r of gateRows) {
        const row = r as { status: string };
        gateByStatus[row.status] = (gateByStatus[row.status] ?? 0) + 1;
      }

      const actionCards: Record<string, string | null> = { previous: null, current: null, next: null };
      for (const r of cardRows) {
        const row = r as { position: string; title: string };
        actionCards[row.position] = row.title;
      }

      const pct = (done: number, total: number) => (total === 0 ? null : Math.round((done / total) * 100));

      return textResult({
        project: p,
        generated_at: new Date().toISOString(),
        phases: {
          total: phaseRows.length,
          by_status: phaseByStatus,
          cached_rollup: {
            total_tasks: cachedTotal,
            completed_tasks: cachedDone,
            progress_pct: pct(cachedDone, cachedTotal),
          },
        },
        tasks: {
          total: derivedTotal,
          by_status: taskByStatus,
          by_execution_mode: taskByMode,
          by_assignee: taskByAssignee,
          overnight_candidates: overnight,
          task_rollup: {
            total_tasks: derivedTotal,
            completed_tasks: derivedDone,
            progress_pct: pct(derivedDone, derivedTotal),
          },
        },
        rollup_drift: {
          total_tasks: { cached: cachedTotal, derived: derivedTotal, drifted: cachedTotal !== derivedTotal },
          completed_tasks: { cached: cachedDone, derived: derivedDone, drifted: cachedDone !== derivedDone },
        },
        gates: {
          total: gateRows.length,
          by_status: gateByStatus,
        },
        action_cards: actionCards,
      });
    } catch (err) {
      return errorResult((err as Error).message);
    }
  }
);

// --- Hono App with Auth + CORS (mirrors open-brain-mcp) ---

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-brain-key, accept, mcp-session-id",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
};

const app = new Hono();

app.options("*", (c) => c.text("ok", 200, corsHeaders));

app.all("*", async (c) => {
  const provided =
    c.req.header("x-brain-key") || new URL(c.req.url).searchParams.get("key");
  if (!provided || provided !== MCP_ACCESS_KEY) {
    return c.json({ error: "Invalid or missing access key" }, 401, corsHeaders);
  }

  // StreamableHTTPTransport requires Accept: text/event-stream.
  // Claude Desktop / claude.ai connectors don't always send it — patch the raw request.
  if (!c.req.header("accept")?.includes("text/event-stream")) {
    const headers = new Headers(c.req.raw.headers);
    headers.set("Accept", "application/json, text/event-stream");
    const patched = new Request(c.req.raw.url, {
      method: c.req.raw.method,
      headers,
      body: c.req.raw.body,
      // @ts-ignore -- duplex required for streaming body in Deno
      duplex: "half",
    });
    Object.defineProperty(c.req, "raw", { value: patched, writable: true });
  }

  const transport = new StreamableHTTPTransport();
  await server.connect(transport);
  return transport.handleRequest(c);
});

Deno.serve(app.fetch);
