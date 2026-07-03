# Sparkle Finder Decisions

## 2026-07-03 - Homepage Collector Stats Should Track Hunt Value

Decision: The homepage collector profile card should show `Owned`, `Wishlist`, `Diamonds`, `Unicorns`, and `Found by Sparkle Finder`. Do not use `Saved` as a homepage stat, and do not use `Featured` as a headline homepage stat.

Reason: Louis wants the stats to drive collection-building and the hunt for meaningful pieces. `Saved` is too broad to matter, and `Featured` is just a subset of owned/showcase behavior. Diamonds and unicorns are the emotional "home run" stats, and `Found by Sparkle Finder` proves the product works.

## 2026-07-03 - Found By Sparkle Finder Requires Acquisition Provenance

Decision: `Found by Sparkle Finder` should be counted from durable acquisition-source data on owned collection items. Count sources `sparkle_finder_lead` and `nic_nac_request`; do not infer Finder success from an item merely being owned or present in the catalog.

Reason: The number should be trusted as product impact evidence. Provenance must be captured when Nic-Nac or a lead flow helps a customer find a piece, otherwise the stat becomes another fuzzy vanity count.

## 2026-07-03 - Supabase Migration History Should Be Kept Clean

Decision: Supabase migration cleanup should repair migration history only after verifying live database artifacts, then apply genuinely missing additive migrations through the normal CLI path. Keep `supabase/.temp` ignored so the repo can stay linked locally without dirty files.

Reason: The live database can be correct while `supabase_migrations.schema_migrations` is wrong. Blindly replaying old migrations risks conflicts; repairing only verified history plus applying missing additive migrations restores the safe future path where `supabase db push --yes` reports `Remote database is up to date.`

## 2026-06-22 - Sparkle Suite Rep Linking Uses Secret Rep ID Number

Decision: Sparkle Finder rep linking uses the private Sparkle Suite `Secret Rep ID Number`. The claim must be verified server-side against Sparkle Suite before Finder writes `is_rep`, the Suite rep id, and Rep Silver membership. Normal authenticated users must not be able to self-write rep identity columns directly.

Reason: Louis wants a durable cross-product identity for the same Nic-Nac experience without relying on email matching or public referral codes, and without weakening Sparkle Finder's separate auth boundary.

## 2026-06-20 - Active Workspace

Decision: Sparkle Finder's active Codex workspace is `C:\Users\louis\sparkle-finder-repo`.

The former binder/Open Brain folder at `C:\Users\louis\sparkle-finder` is no longer the active workspace. Durable binder content has been copied into the implementation repo so code, docs, vault memory, plans, handoffs, and skills live under one root.

Reason: Codex kept opening the lightweight binder as the workspace while the implementation repo lived elsewhere, making normal repo work look outside the sandbox and causing repeated approval prompts.

## Standing Product Auth Boundary

Each customer-facing product should keep its own auth boundary by default. Sparkle Finder customer auth should not be routed through Neon Rabbit HQ, Sparkle Suite, or another product unless Louis explicitly approves that architecture for the specific product.

## 2026-06-22 - Finder Nic-Nac Follows The OpenAI-Only Product Policy

Decision: Sparkle Finder Nic-Nac should use the same OpenAI-only model policy direction as Sparkle Suite Nic-Nac. Do not hardcode Anthropic/Haiku model IDs in Finder route files, and do not keep an unused Anthropic provider dependency for Finder Nic-Nac.

Reason: Louis wants fewer AI vendor accounts to troubleshoot and bill, and Nic-Nac should feel like one shared Sparkle ecosystem assistant rather than separate provider-specific assistants per product.

## 2026-06-22 - Linked Reps In Finder Keep Identity But Not Suite Mutation Access

Decision: When Finder knows an account is linked to a Sparkle Suite rep, Finder Nic-Nac should treat that as the same assistant relationship but keep current-surface tools limited to Sparkle Finder. Sparkle Suite workspace mutations requested from Finder should be redirected to Sparkle Suite login/opening, with context preserved in the conversation tone.

Reason: This matches Louis's expectation that reps feel like they are talking to the same Nic-Nac on both products while keeping security and troubleshooting boundaries clear.
