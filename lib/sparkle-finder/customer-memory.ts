export type SparkleFinderCustomerMemoryType =
  | "style_preference"
  | "collection_goal"
  | "current_hunt"
  | "favorite_rep"
  | "rep_preference"
  | "size_or_fit_note"
  | "gift_or_occasion_note"
  | "workflow_preference"
  | "guarded_note";

export type SparkleFinderCustomerMemorySource = "explicit" | "inferred" | "system";
export type SparkleFinderCustomerMemoryConfidence = "low" | "medium" | "high";

export type SparkleFinderCustomerMemory = {
  id: string;
  userId: string;
  memoryType: SparkleFinderCustomerMemoryType;
  summary: string;
  source: SparkleFinderCustomerMemorySource;
  confidence: SparkleFinderCustomerMemoryConfidence;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
};

export type CustomerMemoryWriteInput = {
  userId: string;
  memoryType: SparkleFinderCustomerMemoryType;
  summary: string;
  source: SparkleFinderCustomerMemorySource;
  confidence: SparkleFinderCustomerMemoryConfidence;
  expiresAt?: string | null;
};

export type CustomerMemoryWriteResult =
  | {
      ok: true;
      memory: SparkleFinderCustomerMemory;
    }
  | {
      ok: false;
      reason: "empty_memory" | "unsafe_memory";
    };

export type CustomerMemoryStore = {
  listByUserId: (userId: string) => Promise<SparkleFinderCustomerMemory[]>;
  upsert: (input: CustomerMemoryWriteInput) => Promise<SparkleFinderCustomerMemory>;
};

export type SupabaseCustomerMemoryClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
  };
};

export function createInMemoryCustomerMemoryStore(
  seed: SparkleFinderCustomerMemory[] = [],
): CustomerMemoryStore & { records: SparkleFinderCustomerMemory[] } {
  const records = [...seed];

  return {
    records,
    async listByUserId(userId) {
      return records
        .filter((memory) => memory.userId === userId)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    },
    async upsert(input) {
      const now = new Date().toISOString();
      const memory: SparkleFinderCustomerMemory = {
        id: `memory-${records.length + 1}`,
        userId: input.userId,
        memoryType: input.memoryType,
        summary: cleanMemorySummary(input.summary),
        source: input.source,
        confidence: input.confidence,
        createdAt: now,
        updatedAt: now,
        expiresAt: input.expiresAt ?? null,
      };

      records.push(memory);
      return memory;
    },
  };
}

export function createSupabaseCustomerMemoryStore(client: SupabaseCustomerMemoryClient): CustomerMemoryStore {
  return {
    async listByUserId(userId) {
      const { data, error } = await client
        .from("sparkle_finder_customer_memory")
        .select("id,user_id,memory_type,summary,source,confidence,created_at,updated_at,expires_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error || !Array.isArray(data)) {
        return [];
      }

      return data.flatMap(mapSupabaseMemoryRow);
    },
    async upsert(input) {
      const { data, error } = await client
        .from("sparkle_finder_customer_memory")
        .insert({
          user_id: input.userId,
          memory_type: input.memoryType,
          summary: cleanMemorySummary(input.summary),
          source: input.source,
          confidence: input.confidence,
          expires_at: input.expiresAt ?? null,
        })
        .select("id,user_id,memory_type,summary,source,confidence,created_at,updated_at,expires_at")
        .single();

      if (error) {
        throw error;
      }

      const memory = mapSupabaseMemoryRow(data)[0];

      if (!memory) {
        throw new Error("Sparkle Finder customer memory insert did not return a memory row.");
      }

      return memory;
    },
  };
}

export async function getSafeCustomerMemoryForPrompt(
  store: Pick<CustomerMemoryStore, "listByUserId">,
  userId: string,
): Promise<SparkleFinderCustomerMemory[]> {
  const now = Date.now();
  const memories = await store.listByUserId(userId);

  return memories.filter((memory) => {
    if (!memory.summary || isUnsafeMemorySummary(memory.summary)) {
      return false;
    }

    if (!memory.expiresAt) {
      return true;
    }

    return Date.parse(memory.expiresAt) > now;
  });
}

export async function writeCustomerMemory(
  store: Pick<CustomerMemoryStore, "upsert">,
  input: CustomerMemoryWriteInput,
): Promise<CustomerMemoryWriteResult> {
  const summary = cleanMemorySummary(input.summary);

  if (!summary) {
    return { ok: false, reason: "empty_memory" };
  }

  if (isUnsafeMemorySummary(summary)) {
    return { ok: false, reason: "unsafe_memory" };
  }

  const memory = await store.upsert({
    ...input,
    summary,
  });

  return { ok: true, memory };
}

function cleanMemorySummary(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

function isUnsafeMemorySummary(summary: string): boolean {
  const normalized = summary.toLowerCase();

  return [
    /\bpassword\b/,
    /\bcredit card\b/,
    /\bcard number\b/,
    /\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/,
    /\bssn\b/,
    /\bsocial security\b/,
    /\bignore (all )?(previous|prior) instructions\b/,
  ].some((pattern) => pattern.test(normalized));
}

function mapSupabaseMemoryRow(row: unknown): SparkleFinderCustomerMemory[] {
  if (!row || typeof row !== "object") {
    return [];
  }

  const record = row as Record<string, unknown>;
  const id = readString(record.id);
  const userId = readString(record.user_id);
  const memoryType = readMemoryType(record.memory_type);
  const summary = readString(record.summary);
  const source = readMemorySource(record.source);
  const confidence = readMemoryConfidence(record.confidence);
  const createdAt = readString(record.created_at);
  const updatedAt = readString(record.updated_at);

  if (!id || !userId || !memoryType || !summary || !source || !confidence || !createdAt || !updatedAt) {
    return [];
  }

  return [
    {
      id,
      userId,
      memoryType,
      summary,
      source,
      confidence,
      createdAt,
      updatedAt,
      expiresAt: typeof record.expires_at === "string" ? record.expires_at : null,
    },
  ];
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readMemoryType(value: unknown): SparkleFinderCustomerMemoryType | null {
  const allowed: SparkleFinderCustomerMemoryType[] = [
    "style_preference",
    "collection_goal",
    "current_hunt",
    "favorite_rep",
    "rep_preference",
    "size_or_fit_note",
    "gift_or_occasion_note",
    "workflow_preference",
    "guarded_note",
  ];

  return allowed.includes(value as SparkleFinderCustomerMemoryType) ? (value as SparkleFinderCustomerMemoryType) : null;
}

function readMemorySource(value: unknown): SparkleFinderCustomerMemorySource | null {
  return value === "explicit" || value === "inferred" || value === "system" ? value : null;
}

function readMemoryConfidence(value: unknown): SparkleFinderCustomerMemoryConfidence | null {
  return value === "low" || value === "medium" || value === "high" ? value : null;
}
