import { describe, expect, it, vi } from "vitest";
import {
  type CurrentSparkleFinderAccountState,
  getCurrentSparkleFinderAccount,
  getSparkleFinderNavStatusLabel,
  mapSparkleFinderAccountRows,
} from "../../lib/sparkle-finder/account-service";
import type {
  SparkleFinderAccessState,
  SparkleFinderSilverSource,
} from "../../lib/sparkle-finder/account-types";

const user = {
  id: "user-123",
  email: "collector@example.com",
};

describe("Sparkle Finder account service", () => {
  it("maps active trial rows to Trial Silver", () => {
    const account = mapSparkleFinderAccountRows({
      user,
      profile: profileRow(),
      membership: membershipRow({
        access_state: "silver_trial",
        silver_source: "trial",
        trial_ends_at: "2026-07-15T00:00:00.000Z",
      }),
      consent: consentRow(),
      now: "2026-06-01T00:00:00.000Z",
    });

    expect(account.status).toBe("authenticated");
    expect(account.tier).toBe("silver");
    expect(account.membership?.effectiveState).toBe("silver_trial");
    expect(getSparkleFinderNavStatusLabel(account)).toBe("Trial Silver");
  });

  it("maps paid rows to Silver", () => {
    const account = mapSparkleFinderAccountRows({
      user,
      profile: profileRow(),
      membership: membershipRow({
        access_state: "silver_paid",
        silver_source: "stripe",
        silver_ends_at: null,
      }),
      consent: consentRow(),
      now: "2026-06-01T00:00:00.000Z",
    });

    expect(account.tier).toBe("silver");
    expect(account.membership?.effectiveState).toBe("silver_paid");
    expect(getSparkleFinderNavStatusLabel(account)).toBe("Silver");
  });

  it("maps rep-included rows to Rep Silver", () => {
    const account = mapSparkleFinderAccountRows({
      user,
      profile: profileRow({ is_rep: true, sparkle_suite_rep_id: "rep-sierra" }),
      membership: membershipRow({
        access_state: "silver_rep_included",
        silver_source: "sparkle_suite_rep",
      }),
      consent: consentRow(),
      now: "2026-06-01T00:00:00.000Z",
    });

    expect(account.tier).toBe("silver");
    expect(account.membership?.effectiveState).toBe("silver_rep_included");
    expect(getSparkleFinderNavStatusLabel(account)).toBe("Rep Silver");
  });

  it("maps expired trials to Free", () => {
    const account = mapSparkleFinderAccountRows({
      user,
      profile: profileRow(),
      membership: membershipRow({
        access_state: "silver_trial",
        silver_source: "trial",
        trial_ends_at: "2026-05-01T00:00:00.000Z",
      }),
      consent: consentRow(),
      now: "2026-06-01T00:00:00.000Z",
    });

    expect(account.tier).toBe("free");
    expect(account.membership?.effectiveState).toBe("free");
    expect(getSparkleFinderNavStatusLabel(account)).toBe("Free");
  });

  it("maps free rows to Free", () => {
    const account = mapSparkleFinderAccountRows({
      user,
      profile: profileRow(),
      membership: membershipRow({
        access_state: "free",
        silver_source: "none",
      }),
      consent: consentRow(),
      now: "2026-06-01T00:00:00.000Z",
    });

    expect(account.tier).toBe("free");
    expect(account.membership?.effectiveState).toBe("free");
    expect(getSparkleFinderNavStatusLabel(account)).toBe("Free");
  });

  it("maps account SMS consent timestamps when present", () => {
    const account = mapSparkleFinderAccountRows({
      user,
      profile: profileRow(),
      membership: membershipRow(),
      consent: consentRow({
        account_sms_allowed: true,
        account_sms_consented_at: "2026-05-31T12:00:00.000Z",
      }),
      now: "2026-06-01T00:00:00.000Z",
    });

    expect(account.communicationConsent.accountSmsAllowed).toBe(true);
    expect(account.communicationConsent.accountSmsConsentedAt).toBe("2026-05-31T12:00:00.000Z");
  });

  it("returns anonymous when Supabase is unconfigured", async () => {
    const account = await getCurrentSparkleFinderAccount({
      isSupabaseConfigured: () => false,
      createSupabaseClient: async () => {
        throw new Error("should not create Supabase client");
      },
    });

    expect(account.status).toBe("anonymous");
    expect(getSparkleFinderNavStatusLabel(account)).toBe("Guest");
  });

  it("returns anonymous when Supabase has no authenticated user", async () => {
    const account = await getCurrentSparkleFinderAccount({
      isSupabaseConfigured: () => true,
      createSupabaseClient: async () => createFakeSupabaseClient({ user: null }),
    });

    expect(account.status).toBe("anonymous");
    expect(getSparkleFinderNavStatusLabel(account)).toBe("Guest");
  });

  it("fails closed to an authenticated Free state when account rows are missing", async () => {
    const account = await getCurrentSparkleFinderAccount({
      isSupabaseConfigured: () => true,
      createSupabaseClient: async () =>
        createFakeSupabaseClient({
          user,
          profile: null,
          membership: null,
          consent: null,
        }),
    });

    expect(account.status).toBe("authenticated");
    expect(account.tier).toBe("free");
    expect(account.displayName).toBe("collector");
    expectAuthenticated(account);
    expect(account.customer.email).toBe(user.email);
    expect(account.membership?.effectiveState).toBe("free");
    expect(account.communicationConsent.accountEmailRequired).toBe(true);
  });
});

type ProfileRow = Parameters<typeof mapSparkleFinderAccountRows>[0]["profile"];
type MembershipRow = NonNullable<Parameters<typeof mapSparkleFinderAccountRows>[0]["membership"]>;
type ConsentRow = NonNullable<Parameters<typeof mapSparkleFinderAccountRows>[0]["consent"]>;

function profileRow(overrides: Partial<NonNullable<ProfileRow>> = {}): NonNullable<ProfileRow> {
  return {
    user_id: user.id,
    display_name: "Casey Collector",
    email: user.email,
    state: "PA",
    is_rep: false,
    sparkle_suite_rep_id: null,
    ...overrides,
  };
}

function membershipRow(overrides: Partial<MembershipRow> = {}): MembershipRow {
  return {
    user_id: user.id,
    access_state: "free" satisfies SparkleFinderAccessState,
    silver_source: "none" satisfies SparkleFinderSilverSource,
    trial_started_at: null,
    trial_ends_at: null,
    silver_started_at: null,
    silver_ends_at: null,
    ...overrides,
  };
}

function consentRow(overrides: Partial<ConsentRow> = {}): ConsentRow {
  return {
    user_id: user.id,
    account_email_required: true,
    account_sms_allowed: false,
    account_sms_consented_at: null,
    promotional_email_opt_in: false,
    promotional_sms_opt_in: false,
    promotional_email_consented_at: null,
    promotional_sms_consented_at: null,
    privacy_acknowledged_at: "2026-05-31T00:00:00.000Z",
    ...overrides,
  };
}

function expectAuthenticated(
  account: CurrentSparkleFinderAccountState,
): asserts account is CurrentSparkleFinderAccountState & { status: "authenticated" } {
  expect(account.status).toBe("authenticated");
}

function createFakeSupabaseClient({
  user: fakeUser,
  profile = profileRow(),
  membership = membershipRow(),
  consent = consentRow(),
}: {
  user: typeof user | null;
  profile?: ReturnType<typeof profileRow> | null;
  membership?: ReturnType<typeof membershipRow> | null;
  consent?: ReturnType<typeof consentRow> | null;
}) {
  const tableData: Record<string, unknown> = {
    sparkle_finder_profiles: profile,
    sparkle_finder_memberships: membership,
    sparkle_finder_communication_consents: consent,
  };

  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: fakeUser }, error: null })),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: tableData[table] ?? null, error: null })),
        })),
      })),
    })),
  };
}
