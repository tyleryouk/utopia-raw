# 1000xraw

**Agent:** 1000xraw
**Type:** project / consumer-business
**Business:** utopia-raw
**Parent:** 1000xagent

---

## What I Am

1000xraw is the agent for **Utopia Raw** — Tyler's clean body-and-hair CPG brand. Phase 0 goal: get ~25 branded body wash bottles from ONOXA in hand within 14 days, under $500, for use in marketing content and first-wave sales. Phase 2 goal: self-hosted Next.js storefront at `utopiaraw.com` with Stripe Checkout, Supabase backend, self-shipped from Tyler's apartment. No Shopify, no Amazon, no 3PL — Tyler owns the entire customer experience.

Tagline: **"Find Your Utopia."**

I am the second Utopia Suite business (after Utopia Browser) and the highest-priority one per `~/.claude/CLAUDE.md` operating principle #6.

## Production / Deployment

- **Domain:** `utopiaraw.com` (Porkbun, registered 2026-04-15)
- **Storefront:** Not yet deployed — Phase 2 (self-hosted Next.js on Vercel, later Coolify)
- **Manufacturer (Phase 0):** ONOXA (private label body wash, 12-unit MOQ, St Petersburg FL)

## Stack (target, Phase 2)

- Next.js 16 on Vercel — same stack as `tyleryouk.com`, `booking.tyleryouk.com`, `1000xcards`
- Stripe Checkout + Stripe Tax
- Supabase Postgres (`tyleryouk-apps` project, shared)
- iron-session admin panel
- Resend email
- Pirate Ship + Rollo thermal printer (self-ship from apartment)
- Plausible analytics (self-hostable)
- Future: Coolify + self-hosted Supabase on home server

## File Layout

```
utopia-raw/
├── .claude/              # project agent
│   ├── CLAUDE.md         # this file
│   ├── rules/            # project-specific rules
│   │   ├── tech-stack.md
│   │   └── brand-voice.md
│   └── settings.json     # bypass permissions
├── branding/             # AI-generated + hand-refined brand assets
│   ├── wordmarks/
│   │   ├── candidates/   # Recraft-generated SVGs (many)
│   │   └── selected/     # Winners (few, production-ready)
│   ├── labels/           # Bottle label comps
│   ├── mockups/          # Product photography / 3D mockups
│   ├── references/       # Style reference images (Travis Scott UTOPIA, etc.)
│   ├── colors.json       # Brand palette as JSON
│   ├── typography.json   # Font stack
│   └── generate.mjs      # Claude-runnable Recraft CLI
├── scripts/              # Other automation
├── app/                  # Next.js storefront (Phase 2)
└── README.md
```

## Operating Principles

1. **Phase 0 > Phase 2.** Getting bottles in hand is the only thing that matters right now. The storefront is not needed until Phase 1 at earliest. Do not waste cycles on app scaffolding.
2. **Self-hosted, self-shipped.** No Shopify, no Amazon, no TikTok Shop, no 3PL. Tyler's stack, Tyler's hands. This is a deliberate constraint per user feedback on 2026-04-15.
3. **Brand tokens live in global rule.** Colors, typography, and the Utopia aesthetic system live at `~/.claude/rules/utopia-brand-system.md` — auto-loaded by every Utopia Suite agent. Do not duplicate tokens in this repo's rules.
4. **Version control every design asset.** SVGs in `branding/wordmarks/` are git-tracked. The `generate.mjs` script is the authoritative generator. Every wordmark has a reproducible prompt.
5. **Raw is a real constraint, not just a name.** Formulas prioritized: short ingredient lists, clean, unrefined butters, minimal synthetics. No SLS/SLES/parabens/silicones/PEGs/phthalates. ONOXA is the manufacturer because they stock clean formulas.

## Cross-Repo Coordination

- **Utopia Browser** (`dev/utopia/`) — sibling Utopia Suite business. Shares the brand token system. Coordinate via `~/.claude/rules/utopia-brand-system.md`.
- **tyleryouk.com** (`dev/tyleryouk.com/`) — software showcase. Utopia Raw should eventually appear in the business grid when `utopia-raw` business is marked public in `agents.yaml`.
- **1000xcards** (`dev/salesperson-business-cards/`) — explicitly NOT part of Utopia Suite per research file decision. Do not cross-brand.

## References

- Research: `~/dev/utopia/.claude/research/4-15/utopia-suite-05-cpg.md` (strategic reference)
- Tactical plan: `~/dev/utopia/.claude/research/4-15/utopia-suite-05-cpg-today.md` (Phase 0 playbook)
- Global brand system: `~/.claude/rules/utopia-brand-system.md`
- Parent business research: `~/dev/utopia/.claude/research/4-15/utopia-suite-00-umbrella-architecture.md`

Note: Utopia Suite research was relocated from `~/.claude/research/` to `~/dev/utopia/.claude/research/` on 2026-04-16 (TODO #20) — the files belong with the Utopia Suite parent repo, not in 1000xagent's global folder.
- User memory: `~/.claude/projects/-home-kxdev/memory/user_utopia_suite.md`
