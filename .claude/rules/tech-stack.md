# Utopia Raw — Tech Stack

**Purpose:** Lock the stack decisions so they don't drift as features get added.

---

## Locked Versions (Phase 2 Storefront)

- **Framework:** Next.js 16.x (App Router, async params, RSC)
- **React:** 19.x
- **Runtime:** Node.js 22.x LTS
- **Language:** TypeScript 5.5+
- **Styling:** Tailwind CSS v4 (match `peptide-shop` / `1000xcards` / `booking.tyleryouk.com` pattern)
- **Package manager:** pnpm (fast, monorepo-ready if we consolidate Utopia Suite later)

## Backend / Infrastructure

- **Database:** Supabase Postgres — shared `tyleryouk-apps` project. Add `utopia_raw_orders`, `utopia_raw_products`, `utopia_raw_customers` tables. Do not create a new Supabase project.
- **Auth (customers):** NO customer accounts at Phase 2. Guest checkout only via Stripe Checkout. Add accounts later if reorder retention proves important.
- **Auth (admin):** iron-session, single `ADMIN_PASSWORD` env var. Same pattern as `booking.tyleryouk.com`.
- **Payments:** Stripe Checkout + Stripe Tax. NO custom payment forms. NO Shopify. NO Amazon.
- **Email:** Resend. Templates in `src/emails/` as React Email components.
- **Hosting:** Vercel (Tyler's paid `dev-7089s-projects` scope). Migrate to Coolify + self-hosted Supabase when home server ships.
- **Domain:** `utopiaraw.com` (Porkbun → CNAME to `cname.vercel-dns.com`).
- **DNS registrar:** Porkbun. NOT IONOS (IONOS is for `tyleryouk.com` only).

## Fulfillment

- **Labels:** Pirate Ship API (no ShipStation, no FBA, no MCF, no 3PL)
- **Printer:** Rollo thermal label printer (~$60 one-time)
- **Shipping:** USPS Ground Advantage from Tyler's apartment

## Analytics

- **Web analytics:** Vercel Analytics (free tier) + Plausible (self-hostable). NO Google Analytics, NO Meta Pixel, NO TikTok Pixel.

## Dependencies to Avoid

- ❌ Shopify / Shopify Hydrogen / Shopify Functions
- ❌ Amazon Seller Central SDKs / MWS / SP-API
- ❌ TikTok Shop SDK
- ❌ Klaviyo (use Resend + custom templates)
- ❌ ShipStation / ShipBob / ShipHero client libs
- ❌ Google Analytics / Meta Pixel / TikTok Pixel
- ❌ Any third-party service that would be unreasonable to self-host on Coolify later

## Dev Workflow

- Bypass permissions default (via `.claude/settings.json`, see `~/.claude/rules/permission-policy.md`)
- Git author: `tyleryouk@gmail.com` (Vercel convention, see `feedback_vercel_git_author.md` memory)
- Tests: Vitest + Playwright for E2E when the storefront exists
- Build output: `next build` with `output: 'standalone'` so Docker image works for Coolify migration
