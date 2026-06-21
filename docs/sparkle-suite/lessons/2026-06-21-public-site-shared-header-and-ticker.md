# Public Site Shared Header and Ticker Lesson

Date: June 21, 2026

## Context

During BlingKitchen public-site review, Louis reported that Trade Board and Live Queue were missing from the header area and later that the header text/tickers were hard to read or paced incorrectly.

The first fix placed workspace-backed Trade Board and Live Queue content into the moving ticker, but Louis clarified that he wanted the exact Sparkle Suite template header code, not a similar pattern or a new custom header.

## Decisions

- Use one shared `SparkleSuiteHeaderStack` for the default Amethyst homepage and migrated hybrid sites such as Mile High Fizz, Britt With Bling, and BlingKitchen.
- Do not create a bespoke header clone when Louis asks for the Sparkle Suite template header.
- Keep Trade Board and Live Queue in the shared header/ticker/queue stack so all migrated sites inherit the same behavior.
- Use one public-site ticker speed everywhere: `tickerSpeed: 1` and `72s` animation durations.
- Announcement and Trade Board ticker rows should use the same speed.
- Cache-bust Amethyst static assets after changing public-site JS/CSS so the stable demo loads the new bundle.

## What To Verify Next Time

Before reporting a public-site header/ticker fix as live:

1. Confirm the stable demo alias points to the intended deployment.
2. Verify the exact customer route on `https://sparkle-suite-demo.vercel.app`.
3. Confirm the loaded HTML references the new asset version.
4. Confirm the deployed CSS/JS no longer contains the old broken value.
5. Use Playwright or Chrome to visually inspect the rendered header, ticker, Trade Board row, and Live Queue row.

## Communication Lesson

Keep Louis-facing closeouts short and bottom-line-first. For ordinary Sparkle Suite review work, give the stable demo link, verification, and commit. Do not make Louis chase raw Vercel preview URLs or sort through deployment internals unless he asks.
