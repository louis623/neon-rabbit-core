import { Gem, KeyRound, ShieldCheck } from "lucide-react";
import { claimSparkleSuiteRepAccount } from "@/app/account/actions";
import type { CurrentSparkleFinderAccountState } from "@/lib/sparkle-finder/account-service";

type RepClaimPanelProps = {
  accountState: CurrentSparkleFinderAccountState;
};

export function RepClaimPanel({ accountState }: RepClaimPanelProps) {
  if (accountState.status !== "authenticated") {
    return null;
  }

  if (accountState.repEntitlement) {
    return (
      <section className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
        <div className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-1 size-5 text-[var(--sparkle-coral)]" />
          <div>
            <h2 className="text-lg font-bold text-[var(--sparkle-plum-deep)]">Rep badge linked</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
              {accountState.repEntitlement.businessName} is linked to this Sparkle Finder account for Rep Silver
              and Nic-Nac context.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
      <div className="flex items-start gap-3">
        <Gem aria-hidden="true" className="mt-1 size-5 text-[var(--sparkle-coral)]" />
        <div>
          <h2 className="text-lg font-bold text-[var(--sparkle-plum-deep)]">Claim your BP Rep badge</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Link this Sparkle Finder account to your Sparkle Suite workspace with your private rep number.
          </p>
        </div>
      </div>
      <form action={claimSparkleSuiteRepAccount} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          Secret Rep ID Number
          <input
            autoComplete="off"
            className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-normal text-[var(--sparkle-ink)]"
            maxLength={80}
            name="secretRepIdNumber"
            placeholder="Enter your private rep number"
            required
          />
          <span className="text-xs font-semibold leading-5 text-[var(--sparkle-ink-muted)]">
            Shown inside Sparkle Suite only. Do not share this number publicly.
          </span>
        </label>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white transition active:translate-y-px"
          type="submit"
        >
          <KeyRound aria-hidden="true" className="size-4" />
          Claim BP Rep badge
        </button>
      </form>
    </section>
  );
}
