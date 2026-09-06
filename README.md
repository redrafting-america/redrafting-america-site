# Redrafting America — Website

**Version:** 001.20260813.040105
**Site version:** v0.7 BETA

`www.redraftingamerica.org` — the canonical public-facing site for a nonprofit civic initiative designing **Constitution v2.0**, a modern constitutional framework built around truth, accountability, and human dignity.

## Cloudflare publication

The production site is packaged as static assets for Cloudflare Workers. Run
`./scripts/build-cloudflare-site.sh` to create the controlled `dist/` output,
then validate the Cloudflare upload with `npx wrangler deploy --dry-run`.

Only the active public site is copied into `dist/`: the root public files,
`assets/`, and `pages/`. Historical `archive/`, working `site-work/`, reusable
`templates/`, repository documentation, and Git metadata are deliberately not
published. The build also creates the stable legacy paths formerly supplied by
Vercel rewrites. Keep `vercel.json` only as a migration reference until the
Cloudflare preview and production domains have been verified; it is not used by
the Cloudflare deployment.

The Worker serves the active static assets only on
`www.redraftingamerica.org`. Requests for `redraftingamerica.org`,
`redraftingamerica.us`, `www.redraftingamerica.us`, `redrafting.us`, and
`www.redrafting.us` receive a permanent redirect to the same path and query on
the canonical `https://www.redraftingamerica.org` origin.

> **Domain discrepancy — unresolved.** This README names `www.redraftingamerica.org` as canonical, while the GitHub organization profile lists `https://redrafting.us`. Both are public and they disagree. Settle which is authoritative and correct the other.

## TL;DR

This site is deliberately simple: static HTML, no framework, no database, no build step. It replaced a much heavier 2025 plan (Next.js, Supabase, Stripe, live accounts, a $1/month verification model) that was architected for a scale and feature set the organization hasn't reached yet. The governing rule since: build for a real, current requirement — never an anticipated one. Full reasoning in **§4**; the actual decision-by-decision history is in **§5**; what's coming next is in **§6–7**.

---

## Redrafting America Migration (August 4, 2026)

- Renamed the public organization from **The Utopia Project US** to **Redrafting America** across current pages, metadata, RSS, contact links, and shared navigation.
- Changed the canonical public origin to `https://www.redraftingamerica.org` and the public contact address to `info@redraftingamerica.org`.
- Added the official Web and Print logo masters as `assets/images/redrafting-america-logo-web.png` and `assets/images/redrafting-america-logo-print.png`; public pages use the Web master.
- Regenerated PNG browser and device icons from the official Web logo.
- Preserved `archive/` snapshots unchanged as historical records; Vercel continues to serve them with `noindex, nofollow, noarchive` headers.

---

## Readability and Canonical-Domain Update (August 5, 2026)

- Promoted the professional RC25 Republic-default National Seal web master to the stable website derivative `assets/images/seal.png`. The outgoing website seal is retained in `archive/assets/images/seal-pre-rc25-2026-08-31.png` as a rollback copy; the authoritative professional package remains in the governed graphics library.
- Removed the Mission hero's legacy circular image mask so the RC25 Seal's exterior digital circuitry remains visible, and replaced its rectangular box shadow with a transparency-aware drop shadow.
- Made the Mission hero Seal an accessible enlargement control. It now opens the complete 2000-pixel Web master in an on-page viewer, retains a direct original-size image link, and preserves the full exterior circuitry without cropping.
- Added a public Table of Contents for the pending Bylaws with all twenty-four article introductions reproduced verbatim from the current Draft 18 review set, activated the shared About navigation link, and established `/bylaws.html` as its stable public address.
- Added the stable derivative `assets/images/constitution-v2-lexicon.png` from the `RDA-GRA-0019` archival family, giving the Constitutional Institutions rows and reference footer more breathing room, and enlarged the Lexicon's homepage presentation.
- Updated both Official Constitutional Lexicon orientations with the RC25 Republic-default National Seal, preserving the complete circuitry field in a fitted square header treatment. The homepage portrait now uses the same accessible full-size viewer interaction as the Mission Seal.
- Rebalanced the “Bots on the Street” response cards around their actual content width so quotations remain readable beside the desktop navigation panels and on mobile screens.
- Removed inherited sticky-footer behavior that could obscure long pages, then audited all 47 active pages at desktop and mobile widths.
- Changed canonical website, Open Graph, RSS, and public absolute URLs to `https://www.redraftingamerica.org`; the apex domain now redirects to `www`.

---

## Search-Result Messaging Update (August 6, 2026)

- Made the authorized Public Mission Statement the homepage's visible opening description and its search and social-sharing description.
- Added the canonical homepage URL and Organization/WebSite structured data using the canonical `www` origin.
- Excluded navigation, calls to action, contact information, and footer boilerplate from eligible search-result snippets so Google and Bing can prioritize the mission language while continuing to index the page normally.
- Added canonical public URLs to the active Mission, Cultural Influences, and Careers pages.
- Added a root XML sitemap containing only the pages identified as active in the public HTML site map, and declared it in `robots.txt`.

---

## 1. Website Goals

The site exists to present, explain, and evolve Constitution v2.0, and to represent Redrafting America as an organization. Current, real goals:

- Present Constitution v2.0 — its Articles, its companion Explainers, and the reasoning behind it — in a form people can actually read and understand.
- Represent the organization honestly: its mission, its founding leadership, its current stage of formation.
- Curate supporting material (Cultural Influences) that reflects the project's values.
- Build toward structured public deliberation on the Constitution itself, once the foundation for that exists.

This list is intentionally shorter than the project's original 2025 concept document. See **§4 (Why We Simplified)** for what changed and why.

---

## 2. Current Structure (scalable static layout)

### Approved information-architecture scaffold (August 1, 2026)

The approved scaffold expands the subject hierarchy without adding unfinished destinations to the main navigation. Every unfinished HTML scaffold carries a `noindex` directive until its public content is reviewed.

```
pages/
├── about/
│   ├── index.html
│   ├── our-story.html
│   ├── mission.html
│   ├── leadership.html
│   ├── contributors-and-advisors.html
│   ├── governance.html
│   ├── transparency.html
│   └── project-roadmap.html
├── constitution2/
│   ├── index.html
│   ├── declaration.html
│   ├── preamble.html
│   ├── comparison.html
│   ├── version-history.html
│   ├── articles/
│   │   └── index.html
│   └── explainers/
│       └── index.html
├── learn/
│   ├── index.html
│   ├── drafting-room/
│   ├── cultural-influences.html
│   ├── constitutional-glossary.html
│   ├── plain-language-guides/
│   ├── case-studies/
│   ├── teaching-resources/
│   └── faq.html
├── newsroom/
│   ├── index.html
│   ├── board-minutes/
│   ├── press-releases/
│   ├── news-coverage.html
│   └── media.html
├── get-involved/
│   ├── index.html
│   ├── careers.html
│   ├── partnerships.html
│   ├── donate.html
│   └── contact.html
├── policies/
│   ├── privacy.html
│   ├── terms.html
│   ├── accessibility.html
│   ├── copyright-and-reuse.html
│   └── corrections.html
└── utility/
    ├── search.html
    └── site-map.html

templates/
├── constitution-article.html
└── constitution-explainer.html
```

**Approved scope boundaries:**

- Article Explainers contain what the Article means, why its direction was chosen, and the supporting sources; there are no separate Design Principles or Sources pages.
- Drafting Process, Adoption and Transition, and downloadable constitutional editions remain deferred to v2.0 and are not scaffolded.
- Pre-Convention public-comment, proposal, and deliberation pages are not scaffolded. Structured participation waits for the Digital Constitutional Convention; social channels may provide informal discussion after official accounts exist.
- The main navigation remains limited to completed public destinations. Scaffold pages are not linked there merely because files exist.
- Reusable working templates live under `templates/`, which is excluded from search indexing along with `archive/` and `site-work/`.

### Current six-category synchronization (August 1, 2026)

The approved public category order is now:

1. **About**
2. **Constitution v2.0**
3. **Learn**
4. **Community**
5. **Newsroom**
6. **Get Involved**

The corresponding current page organization is:

```text
pages/
├── about/
├── constitution2/
├── learn/
├── community/
│   ├── index.html
│   └── drafting-room/
├── newsroom/
│   ├── index.html
│   ├── cultural-influences.html
│   ├── board-minutes/
│   ├── press-releases/
│   ├── news-coverage.html
│   └── media.html
├── get-involved/
├── policies/                     # Footer and legal support content
└── utility/                      # Search and site-map support content
```

`policies/` and `utility/` remain support sections rather than seventh and eighth main categories. The Drafting Room now belongs to Community as the project blog, while Cultural Influences belongs to Newsroom. Stable public addresses are preserved through Vercel rewrites even though the physical files have moved.

The Drafting Room separates publications by editorial purpose. **Papers** present developed constitutional arguments, institutional proposals, manifestos, and civic positions; readers should expect a sustained case or defined position supported by the author’s reasoning. **Drafting Notes** document constitutional inquiry in progress through interviews, experiments, observations, working ideas, and open questions; readers should expect exploration rather than an adopted or settled position.

Publications use stable, descriptive title slugs rather than sequence numbers. Original publication dates determine display order but never change an article’s identity or address. Every publication carries a category, summary, reading-time label, and a small set of reader-facing topic tags. The Drafting Room search matches titles, summaries, categories, and tags; category controls and the topic selector narrow both publication lists without creating separate archive pages. During the beta, numbered and `field-notes` addresses are replaced rather than retained; public links use `/drafting-room/papers/<slug>.html` or `/drafting-room/drafting-notes/<slug>.html`. A renamed organization is presented under its current name in republished work while the original publication date is preserved.

The earlier incremental structure notes remain below as part of the README's retained history.

The repository separates public content pages from shared assets and operational files. The filesystem is organized by subject area rather than by navigation order: navigation can change as the site evolves, while stable content categories remain understandable and scalable.

```
website/
├── index.html                              # Homepage; root location required
├── 404.html                                # Custom not-found page; root location required by Vercel
├── pages/                                  # Customer-facing content pages
│   ├── about/
│   │   ├── mission.html
│   │   └── careers.html
│   ├── research/
│   │   └── cultural-influences.html
│   └── drafting-room/
│       ├── index.html
│       ├── papers/                       # Sustained essays and developed arguments
│       │   ├── a-call-to-the-people.html
│       │   ├── america-at-250.html
│       │   ├── founders-introduction.html
│       │   └── godwins-law.html
│       └── drafting-notes/               # Interviews, experiments, observations, and open questions
│           └── bots-on-the-street.html
├── assets/                                 # Shared resources, never page content
│   ├── audio/
│   ├── data/
│   │   ├── cultural-influences.json        # Editorial source data
│   │   └── cultural-influences.js          # Local-file-compatible browser data mirror
│   ├── images/
│   │   ├── bots-on-the-street/             # Production copies of the ten AI response records
│   │   ├── citizen-portal.png                # Redrafting America civic-services concept
│   │   ├── constitution-v2-draft-in-progress.png # Active Constitution v2.0 artifact graphic
│   │   ├── constitution-v2-lexicon.png       # Landscape constitutional reference chart
│   │   ├── constitution-v2-lexicon-portrait.png # Portrait constitutional reference chart
│   │   ├── eleven-pillars-of-leadership.png  # Full-resolution Careers model
│   │   ├── redrafting-america-logo-design-spec.png # One-page brand standard
│   │   ├── seal.png                          # Web national-seal concept
│   │   └── united-republic-seal-print.png    # Print national-seal concept
│   ├── scripts/
│   │   ├── drafting-room.js                  # Drafting Room page behavior
│   │   └── site-shell.js                     # Shared panels, drawer, footer, and navigation model
│   └── styles/
│       ├── brand-lockup.css                  # Permanent stacked header wordmark
│       └── site-shell.css                    # Shared responsive site shell and controls
├── archive/                                # Locked historical release copies
├── site-work/                              # Git-backed work in progress
├── rss.xml                                 # The Drafting Room RSS feed
├── sitemap.xml                             # Canonical URLs for active public pages only
├── robots.txt                              # Search-engine exclusions
├── vercel.json                             # Stable public-route mapping and headers
└── README.md                               # This file
```

Future constitutional material follows the same hierarchy:

```
pages/constitution2/
├── index.html
├── articles/
│   ├── article-01.html
│   ├── article-02.html
│   └── ...
└── explainers/
    ├── article-01.html
    ├── article-02.html
    └── ...
```

Public URLs are intentionally independent of physical storage. Vercel rewrites keep established top-level addresses such as `/mission.html` working even though their source files are grouped under `pages/`. Drafting Room publications use category-and-slug routes that map directly to the matching source category and filename. This preserves understandable public addresses while allowing the repository to scale.

The original v0.3 structure section is retained below for historical reference.

## 2. Current Structure (as of v0.3)

```
website/
├── index.html                    # Homepage
├── mission.html                  # Full mission statement
├── careers.html                  # Careers & Leadership (Eleven Pillars structure)
├── cultural-influences.html      # Curated media library
├── 404.html                      # Custom not-found page (auto-served by Vercel)
├── data/
│   └── cultural-influences.json  # Clip data — no database, just a file
├── images/                       # All visual assets, pre-compressed for web
├── audio/                        # Background music tracks
└── README.md                     # This file
```

Every page shares the same hand-maintained header, footer, navigation, and design system — copy-pasted across files rather than templated. This is a known, deliberate limitation; see the **v1.0 roadmap** for the fix.

---

## 3. Current Tech Stack

| Layer | Choice |
|---|---|
| Framework | None — static HTML, CSS, vanilla JavaScript |
| Hosting | Vercel |
| Source control | GitHub (`redrafting-america` org) |
| Database | None — Cultural Influences reads a static JSON file |
| Styling | Plain CSS custom properties (no Tailwind, no component library) |
| Fonts | Fraunces (display), Public Sans (body), IBM Plex Mono (utility/labels) |
| Interactivity | Small, scoped vanilla JS: mobile nav, background music toggle, Cultural Influences filter/sort, 404 site search |

No build step. No package manager. No server. Editing a page means editing an HTML file and pushing.

**Local-file compatibility note:** Cultural Influences remains a static-data feature with no database. The JSON file is the editorial source record; the equivalent JavaScript data file allows the same material to load when the website is opened directly from disk, where browsers commonly block `fetch()` requests for local JSON. The two files must remain synchronized whenever the collection changes.

---

## 4. Why We Simplified

The project's original technical concept (2025) specified a considerably heavier stack: **Next.js, Cloudflare Pages and Workers, Supabase (Postgres, Auth, Realtime, Row-Level Security), Stripe, Tailwind CSS, Shadcn/Radix UI, and analytics via Plausible or PostHog** — architected around a long-term vision of user accounts, live comment threads with voting, credit-card identity verification, a $1/month subscription model, and scale up to "340 million users."

None of that was wrong as a *long-term* picture. It was premature as a *starting point*. Here's what changed, piece by piece:

**Framework — Next.js → static HTML.**
Every real page on the current site is fixed content until a visitor wants to filter or sort something (Cultural Influences), which a small vanilla JS "island" handles without a framework at all. Next.js earns its cost when a site needs server rendering, complex client state, or dynamic routing — none of which any current page actually requires. Paying that cost anyway was overhead with nothing behind it.

**Database — Supabase → a static JSON file (for now).**
Cultural Influences was originally built against a live Supabase table. When that database needed reconnecting to the new infrastructure, the honest question got asked: does this content actually need a live database? It doesn't — it's curated by the founder, not submitted or moderated by end users. A database earns its keep when data is genuinely dynamic; "changes occasionally when I edit a file" isn't that. The same logic applies to the rest of the site: nothing here currently needs a backend.

**Identity verification & monetization — Stripe + $1/month → deferred, and reconsidered.**
This isn't just a simplification, it's a correction: the original plan used a $1 charge as an identity-verification step. On inspection, a $1 charge verifies that a card is *live*, not who's holding it — the same low-friction mechanic carding fraud rings use to test stolen cards. A public sign-up flow built around it would have been a plausible fraud target, independent of whether the site needed monetization yet at all. Real identity verification, if it's ever needed, requires purpose-built tooling (Stripe Identity, Persona, ID.me) — a different and more expensive category of tool than what was originally scoped.

**Comments & voting ("Town Hall," now the Digital Constitutional Convention) — merged into the app → its own separate system.**
The original architecture built live discussion and voting directly into the same Next.js application as the informational site. The current plan treats these as two different kinds of software entirely: a content site (read top-to-bottom, mostly static, low operational risk) and a deliberation platform (accounts, sessions, moderation, real-time state, real legal and safety exposure). Merging them means the whole site inherits the complexity — and the risk profile — of its hardest component. The DCC will be its own infrastructure (most likely Discourse or similar), linked and embedded into Article pages rather than built into them.

**Scale target — "340 million users" → the organization's actual current stage.**
The original plan was architected for full national civic participation from day one. The organization's actual current stage: pre-launch, pre-501(c)(3) determination, one founder, zero live user accounts. Designing infrastructure for the scale you hope to reach, rather than the scale you're actually at, was the single biggest gap between the 2025 plan and what's real today.

**What we kept, or would keep:**
Not everything in the original plan was over-scoped. **Plausible/PostHog-style privacy-friendly analytics** remains a genuinely reasonable, low-cost, low-complexity choice whenever analytics are actually added — it just hasn't been needed yet. And **Cloudflare** remains in active use today, just in a narrower role: as the DNS and domain registrar, not as the hosting/compute layer.

**The general rule this produced:** match infrastructure to a real, current requirement — not to an anticipated one, and not to whichever tool sounds most sophisticated. Every major technical decision since has been measured against this rule, including ones that added complexity when it was actually earned (see v0.3 below).

---

## 5. Version History

### Two version systems, deliberately

This repository carries two version numbers that mean different things. Confusing them
will desynchronize the README from the live site.

| | Format | What it versions | Where it appears |
|---|---|---|---|
| **Site version** | `v0.7 BETA` | The deployed website as a product | Version pills on every public page, and the entries below |
| **Document version** | `001.20260813.040105` | This README as a managed document | The stamp at the top of this file |

**The `v0.x` entries below are not renamed to the `NNN.YYYYMMDD.HHMMSS` form, and should
not be.** Those numbers are rendered on the live site in the shared-shell version pills. A
reader who sees `v0.7 BETA` in the footer and then opens this repository has to find
`v0.7` here. Renumbering the history would break that correspondence for no gain.

The project-wide `NNN.YYYYMMDD.HHMMSS` convention applies to **managed documents** — files
carrying a canonical identity and a lifecycle code. A website is a deployment target with
its own naming standard, which is exactly why the folder-tree design keeps `web/` outside
`managed/`.

**Rule:** when the site version advances, update the version pills and add an entry below
using the same `v0.x` number. When this README is substantively revised, bump the document
version at the top. The two move independently.

### v0.7 — Redrafting America organization and infrastructure migration

**Date:** *August 4, 2026*

**Status:** `BETA`

**Catalyst:** The nonprofit changed its name from **The Utopia Project** to **Redrafting America**, requiring the public identity, accounts, repositories, hosting, domains, email authentication, and telephone prompts to move together rather than as isolated website edits.

**What changed:**

- Completed the Microsoft 365 identity transition to `redraftingamerica.org`. Public website contact now uses the existing `info@redraftingamerica.org` shared mailbox, the founder retains `todd.mcguckin@redraftingamerica.org`, and `social@redraftingamerica.org` remains available for future channel administration.
- Confirmed that `dmarc@redraftingamerica.org` is an alias on the `info@redraftingamerica.org` shared mailbox and published the initial monitoring policy `v=DMARC1; p=none; rua=mailto:dmarc@redraftingamerica.org; adkim=r; aspf=r; pct=100`. This collects aggregate reports without quarantining or rejecting mail while every legitimate sender is inventoried.
- Created the **Redrafting America** GitHub organization, assigned `RTM135` as an owner, and transferred all nine organization repositories—including the `.github` repository and other dot-folder content—without discarding history. The public website repository is now `redrafting-america/website`, and the organization uses a GitHub Project board to track migration and ongoing work.
- Renamed and transferred the Vercel project to the `redrafting-america` team, retained the GitHub deployment connection, and verified production deployment from the new repository. The canonical website is `https://www.redraftingamerica.org`; `redraftingamerica.org` permanently redirects to the `www` host.
- Added path- and query-preserving permanent redirects from `utopiaproject.us`, `www.utopiaproject.us`, `redrafting.us`, `www.redrafting.us`, `redraftingamerica.us`, and `www.redraftingamerica.us` to the canonical `www` host. The former `utopiaproject.us` redirect will remain active through the domain's planned expiration in 2027.
- Verified automatically managed Let's Encrypt certificates and HTTPS on the canonical website and redirect domains. Vercel owns certificate renewal for the attached domains.
- Cleaned obsolete Microsoft 365 DNS records from the personal `mcguckin.me` and `mcguckin.net` zones while preserving Apple Mail, web, Home Assistant, gateway, and other unrelated records. Their SPF policies now authorize iCloud only; `mcguckin.name` required no Microsoft cleanup.
- Replaced the former public identity with the approved Redrafting America Web and Print logos, regenerated browser/device icons, standardized organization and contact copy, and retained the memorable public telephone display `215-4-UTOPIA` with its numeric dial target.
- Rebuilt the site's principal civic graphics for the new identity: expanded the Citizen Portal to sixteen service categories, modernized the Eleven Pillars governance chart without changing its organizational model, produced Web and Print **United Republic of America** seal concepts, added Redrafting America ownership lines to both Constitutional Lexicon layouts, and created a one-page logo design specification. Every new master carries `© 2026 Redrafting America` where the format permits.
- Chose **Ex Uno Floremus — From One, We Flourish** as the single logo-adjacent motto. **Veritas Super Omnia — The Truth Above All Else** remains the project's governing principle and footer motto.
- Reserved `redraftingamerica` as the standard social handle throughout the site. Facebook is now the first verified replacement channel at `https://www.facebook.com/redraftingamerica/`; its card is active and carries the official `rel="me"` link, while every uncreated platform remains muted and marked **Coming soon**.
- Enlarged the desktop header wordmark to use the available left navigation column without crossing the navigation-card boundary. The crest and two-line **REDRAFTING / AMERICA** wordmark now share the same visual height.
- Updated UniFi Talk's organization-facing voice prompts from The Utopia Project to Redrafting America while retaining the existing `215-4-UTOPIA` telephone number and confirming the new website address in the greeting.
- Advanced every current public version pill from `v0.6 BETA` to `v0.7 BETA` after the migration, DNS, communications, visual, redirect, certificate, and deployment work was completed and verified.
- Standardized the typography, weight, spacing, border, and sizing of every shared-shell version pill to match the home-page treatment, replacing page-specific bold variants.
- Revised both Official Constitutional Lexicon orientations: matched their Seal to the Mission page's authoritative **United Federation of America** design, contained it completely within the title panel, reclaimed footer space for cleaner separation, and carried the expanded institutions treatment into the portrait layout. The website now presents the portrait Lexicon beside its explanatory copy instead of stacking the copy above the landscape chart.

**Validation:** Production pages were checked in the browser after deployment; GitHub and Vercel reported successful checks; the canonical and redirect hosts were tested over HTTPS; redirects were confirmed as HTTP 301 with paths and query strings preserved; Microsoft 365 SPF and DKIM remained present; DMARC was queried from a public resolver; and the personal zones were queried to confirm that Microsoft records were gone while Apple Mail records remained.

**Result:** v0.7 is the first release in which the nonprofit's public identity and supporting infrastructure consistently operate as **Redrafting America**, while the former name survives only where intentionally retained for history, archives, the memorable telephone number, and the time-limited legacy-domain redirect.

### v0.6 — Responsive site shell, scalable navigation, and category overviews

**Date:** *August 2, 2026*

**Status:** `BETA`

**What changed:**

- Reorganized the public site into a scalable subject-based structure under `pages/`, with shared styles, scripts, images, audio, and data under `assets/`. Established durable folders for About, Constitution v2.0, Learn, Community, Newsroom, Get Involved, policies, and utilities so future constitutional Articles and Explainers can grow without crowding the website root.
- Preserved direct local-file review and deployed-server compatibility through depth-aware `<base>` addresses, project-relative physical links, corrected fragment navigation, and Vercel rewrites that retain established public URLs after physical files move.
- Replaced the duplicated page-by-page navigation experience with a shared responsive site shell. Desktop now uses a symmetrical three-column body with Site Navigation on the left, content in the center, and Digital Constitutional Convention controls with Site Audio on the right; the header and footer align to the same geometry and run edge to edge.
- Made mobile navigation a first-class experience. The crest is now an interactive left-side navigation control with a hamburger badge that becomes an X, opening a full-height drawer from the same side where Site Navigation lives on desktop. The drawer contains the complete six-category navigation plus the forthcoming Convention controls and available audio control.
- Established the approved six-category order and concise names: **About**, **Constitution v2.0**, **Learn**, **Community**, **Newsroom**, and **Get Involved**. The Drafting Room now belongs to Community, Cultural Influences belongs to Newsroom, and support policies and utilities remain outside the six primary categories.
- Rebuilt Site Navigation as six vertically stacked pastel cards that share the right-panel design language. Category headings link to real overview pages, subtle category-colored dividers establish hierarchy, live links are visually prominent, and unfinished destinations are accessible muted text rather than dead links.
- Promoted all six category overview pages from hidden scaffolds to public orientation pages. Each overview explains every subcategory, why it matters to the project, and links only to destinations whose public content is ready.
- Moved the universal category-colored breadcrumb into the persistent header. Breadcrumb typography is now consistent across legacy and scaffold-derived pages, category levels link to their overview pages, and Drafting Room papers support the complete hierarchy—for example, `Home / Community / The Drafting Room / Paper No. 1`.
- Standardized the permanent header identity around the crest and two-line **REDRAFTING / AMERICA** wordmark. The header now keeps the logo and navigation control left, breadcrumb center, and burgundy version pill right on desktop, tablet, and mobile. Shared parchment colors prevent individual page styles from changing the header or footer appearance.
- Replaced the homepage’s former **What We’re Building** section with the approved six-part **Start Here** experience so a new visitor can understand the mission, the constitutional work, the supporting reasoning, the publication channel, the project’s current stage, and the appropriate next step from the homepage.
- Added and documented the formal paired content model for every constitutional Article and Explainer, including stable identifiers, official text, plain-language meaning, design reasoning, embedded sources, comparisons, status, version metadata, and coordinated revision histories. Working templates remain excluded from search indexing.
- Expanded Careers with the full-resolution **Eleven Pillars of Leadership** proposed organizational model. Desktop and tablet display the complete graphic; phones retain readable role cards and receive a download link. The prelaunch and volunteer-status disclosure now closes the page immediately before the footer.
- Standardized the footer as `© 2026 Redrafting America. All Rights Reserved.` on the left, **Veritas Super Omnia** centered, and a right-aligned update timestamp explicitly calculated in Philadelphia’s `America/New_York` time zone and labeled **Philly time**. Long desktop fields remain on one line, while narrow screens stack before the fields can collide.
- Strengthened publication discipline: `site-work/` contains only active drafts and is emptied after publication; archives are created only for pages with significant changes in a numbered release, use page-specific folders and `pagename-vX.Y-YYYYMMDD.ext` filenames, are checksum-verified and read-only, and are recorded in `archive/manifest.tsv`. Git remains the user-controlled backup and deployment mechanism; Codex does not commit or push.
- Advanced every public version pill from `v0.5 BETA` to `v0.6 BETA` after owner approval. The detailed development record below is retained as the chronological work log that led to this release.

**Why:** The site had outgrown a flat collection of individually styled pages. It needed a coherent information architecture, dependable local and hosted behavior, a navigation system that scales to constitutional publishing, and a mobile experience equal in quality to desktop.

**Result:** v0.6 presents one consistent public website across desktop, tablet, and mobile; gives every main category a meaningful destination; clearly distinguishes live content from future work; preserves historical releases through a disciplined archive; and provides a stable foundation for the project’s next phase of public communication.

#### v0.6 Development Record — Scalable structure, local compatibility, and Careers model

**Work completed:** *August 1, 2026*

**Release status:** This work was completed while v0.5 remained live and was formally incorporated into the owner-approved v0.6 release dated August 2, 2026.

**Subsequent status-label refinement:** The numbered release remains v0.5, while the public status label changes from `PRELAUNCH` to `BETA`. The displayed pill is therefore `v0.5 BETA`, without a dash.

**What changed:**

- Reorganized customer-facing pages into scalable subject folders under `pages/`, moved shared resources under `assets/`, preserved established public addresses through `vercel.json`, and added the approved information-architecture scaffold. Unfinished scaffold pages remain outside the main navigation and carry `noindex` directives.
- Added the formal Constitution Article and Explainer templates, including status and version metadata, official text, plain-language explanation, embedded sources, comparison material, paired links, and revision histories. Templates remain excluded from search indexing.
- Added the six-part **Start Here** homepage section and then moved it into the former **What We're Building** position, replacing that older section rather than duplicating it.
- Repaired direct local-file use after the folder reorganization. Each HTML page now declares a depth-appropriate `<base>` address back to the website root, and internal graphics, scripts, styles, audio, and navigation use physical project-relative destinations. Vercel continues to preserve the shorter established public aliases for deployed visitors.
- Repaired fragment navigation affected by the new base-address system. Mission table-of-contents links, homepage section links, and accessibility skip links now identify both the physical page and the destination fragment, preventing local browsers from opening the website folder instead of the intended section.
- Added `assets/data/cultural-influences.js` as a local-file-compatible mirror of the static JSON collection so Cultural Influences works both when opened directly and when deployed through Vercel.
- Added the full-resolution **Eleven Pillars of Leadership** graphic to Careers and clearly identified it as the proposed organization being built. Desktop and iPad visitors see the complete tappable graphic; phone visitors retain the existing role-card presentation and receive a full-resolution download link. The detailed HTML role content remains available to assistive technology at larger widths.
- Standardized the public header around a permanent two-line **REDRAFTING / AMERICA** wordmark at every viewport width. A shared `assets/styles/brand-lockup.css` file keeps the icon and stacked text at matching visual heights, scales them together on narrow phones, and prevents the older page breadcrumb from accidentally acting as a wrapped brand name.
- Reclaimed mobile header space by reducing the stacked wordmark to the navigation-category type scale and shrinking the logo to the same visual height. Moved the background-music control from the header to the right side of the sticky footer on all six music-enabled pages, leaving the hamburger right-aligned. Centered the shorter `v0.5 BETA` pill in the mobile header.
- Superseded the interim right-side hamburger and footer-music arrangement with the approved responsive site shell. The header and footer now run edge to edge around a three-column desktop body: Site Navigation on the left, page content in the center, and Digital Constitutional Convention controls with Site Audio beneath them on the right.
- Made the crest the mobile navigation control, with a visible hamburger badge that changes to an X while open. The navigation drawer always enters from the left so its mobile behavior mirrors the desktop Site Navigation panel. The adjacent four-line wordmark remains a separate Home link.
- Added a single shared navigation model in `assets/scripts/site-shell.js`. Completed public destinations are links; unfinished destinations are inert text with a **Coming Soon** label, preventing the site shell from introducing dead links. The DCC preview is also visibly marked **Coming Soon**, and its future controls are disabled rather than presented as usable links.
- Restored the approved footer hierarchy on every public page: copyright left, motto centered, and update date right, with all three stacked and centered on mobile. The label is now **Updated**, and the time and time zone have been removed. Music-enabled pages move their existing control into the right utility panel on desktop and into the mobile drawer beneath the DCC preview.
- Reworked Site Navigation into clearly separated pastel category panels inspired by the original website: About Us (rose), Constitution v2.0 (yellow), Learn (green), Newsroom (orange), and Get Involved (violet). The active category receives a stronger border while all unfinished destinations remain inert and visibly marked **Coming Soon**.
- Added one universal breadcrumb bar above the content area on every public page. Its color automatically matches the active navigation category, while Home, policy, utility, and error pages use the neutral gray treatment. Older page-local breadcrumbs remain in the source as a no-script fallback but are hidden after the shared shell initializes, avoiding duplicate breadcrumbs for normal visitors.
- **Superseding navigation refinement:** Replaced the interim five-category interpretation with the exact six-box visual model from the original design: About Us (rose), Constitution v2.0 (yellow), Learn (green), Community (blue), Media & Press (orange), and Get Involved (violet). Removed the separate Home control from Site Navigation. Future destinations remain non-links, but their visible **Coming Soon** pills were removed so every label fits cleanly within its category box; assistive labels and title text continue to identify those destinations as forthcoming.
- Established one shared `292px` desktop side-column width for both Site Navigation and Convention Controls. The full-width header and footer use the same left/center/right column geometry at desktop sizes, keeping the crest, content area, DCC controls, copyright, motto, and update date aligned symmetrically. Below the desktop threshold, both side panels collapse together into the existing left-side navigation drawer.
- Explicitly locked the shared Site Navigation container to one full-width vertical column. This overrides broad flexbox rules retained by several original pages and guarantees that all six pastel category boxes stack vertically in both the desktop left panel and the mobile drawer, matching the right-panel card arrangement.
- Unified the left and right panel design language. Each pastel Navigation category now uses the same border, corner radius, interior padding, vertical spacing, and Fraunces heading treatment as the Digital Constitutional Convention and Site Audio cards. Added the **Navigation** utility heading above the first left-side card to balance the existing **Convention Controls** heading on the right.
- Synchronized the six main categories to the approved concise nomenclature and order: **About**, **Constitution v2.0**, **Learn**, **Community**, **Newsroom**, and **Get Involved**. Added the Community page folder, moved The Drafting Room from Learn to Community, moved Cultural Influences from Learn to Newsroom, updated all physical local-file links, and retained the established public Drafting Room and Cultural Influences addresses through updated Vercel rewrites.
- Separated documentation responsibilities: the project-root README now explains the entire Redrafting America workspace, while this file remains the authoritative website architecture, maintenance, and release record.
- Moved the universal color-coded breadcrumb bar into the persistent full-width header. On desktop, the header now follows the same symmetrical three-column geometry as the body and footer: logo and wordmark left, breadcrumb centered, and the `v0.5 BETA` pill right. On smaller screens, the crest and version pill share the first row while the breadcrumb spans a second full-width row. Standardized the shared footer copyright to `© 2026 Redrafting America. All Rights Reserved.` while retaining the centered motto and right-aligned update date; these changes remain part of v0.5 maintenance pending the owner-approved v0.6 release.
- Promoted the six hidden category scaffolds into public overview pages for **About**, **Constitution v2.0**, **Learn**, **Community**, **Newsroom**, and **Get Involved**. Each overview now explains every subcategory and why it matters; available destinations are linked while unfinished destinations remain descriptions rather than dead links. Category headings in Site Navigation and category levels in breadcrumbs now link to these overviews. Renamed Community’s former **Blog** label to **The Drafting Room**, standardized breadcrumb typography against legacy page styles, and expanded Paper No. 1 to the full hierarchy `Home / Community / The Drafting Room / Paper No. 1`.
- Strengthened the visual hierarchy inside every Navigation card while retaining left alignment for fast scanning. Major category headings remain dark and prominent, a subtle category-colored divider now separates each heading from its destinations, live links use the primary text color and stronger weight, and unfinished destinations use a muted gray with no interactive hover or pointer treatment. The inactive gray was selected to retain readable contrast across all six pastel backgrounds.
- Prevented the desktop footer’s copyright and update fields from wrapping inside their sidebar-aligned grid cells, allowing each field to use the otherwise open center space while preserving the symmetrical left/center/right anchors. Narrow screens now stack the three footer fields before their combined text can collide. Restored both date and time to the update field, explicitly formatted in the `America/New_York` time zone and labeled **Philly time** so daylight-saving changes are handled correctly without displaying an inaccurate fixed `EST` label.
- Moved the Careers page’s **Where we are right now** disclosure from directly beneath the introductory hero to the bottom of the page, after the leadership model, role details, and founding-role invitation. Its wording and visual treatment remain intact, with “roles below” adjusted to “roles above” to match its new position.
- Made the shared shell’s parchment header and footer colors authoritative across every public page. This supersedes the dark navy header and footer inherited by the six category overviews from their former scaffold stylesheet, preventing the site chrome from changing color when visitors move between established pages and category pages. The burgundy version pill, muted footer information, and gold motto are now standardized with the same shared overrides.
- Right-aligned the public version pill consistently on desktop, tablet, and mobile. The shared shell now explicitly neutralizes the older narrow-screen rule that absolutely centered the pill, keeping it inside the right-aligned header cell opposite the left-side brand and navigation control at every viewport size.

**Why:** The site needed a filesystem that could scale to constitutional Articles, Explainers, educational material, policies, and Newsroom content without crowding the root directory. At the same time, the project owner reviews pages by opening them locally, so the physical organization and address system must work without relying on Vercel. The Careers model also needed to communicate the depth of the proposed organization without implying that its future departments are already staffed.

**Result:** v0.5 now has a scalable content architecture, stable deployed aliases, dependable direct-local viewing, validated section navigation, an explicit Article/Explainer publishing model, a clearer homepage starting point, and a responsive Careers presentation that is ambitious, transparent, and accessible.

**Subsequent shell result:** The unified responsive shell keeps navigation consistently on the left across desktop and mobile, reserves the right panel for DCC and audio utilities, and restores the approved three-part footer without changing the v0.5 release number.

### v0.5 — The Drafting Room and RSS

**Date:** *August 1, 2026*

**What changed:** Launched **The Drafting Room** as the project's public essay and announcement section. Published **Paper No. 1 — Founder's Introduction** at a permanent URL, rebuilt from the approved draft in the site's cream/navy/gold visual system, and added Todd McGuckin's purpose-designed calligraphic author mark. Added The Drafting Room to desktop and mobile navigation across the site, included it in the 404-page search, and adjusted the navigation breakpoint so the expanded menu remains usable at intermediate screen widths. Added a standards-compliant RSS 2.0 feed, RSS autodiscovery metadata, and a subscription link in the homepage Contact section. Canonical and Open Graph URLs were aligned with the site's `redraftingamerica.org` redirect.

**Why:** The project needed a durable publication channel for the reasoning behind Constitution v2.0, beginning with a personal explanation of why the work exists. RSS provides a platform-independent way for readers to follow future papers and constitutional releases without introducing accounts, a mailing-list platform, or a database.

**Result:** The site now has a permanent, branded publishing surface with its first paper live, discoverable from every primary page, searchable from the 404 page, and subscribable through any RSS reader.

### v0.4 — Browser and device identity

**Date:** *August 1, 2026*

**What changed:** Replaced the single general-purpose favicon with a complete browser and device icon set: 16×16 and 32×32 PNG favicons, a multi-size `.ico` file, and a 180×180 Apple touch icon. Updated every public page to declare the appropriate icon variants.

**Why:** The original single favicon did not provide consistent rendering across browser tabs, bookmarks, pinned shortcuts, and mobile home screens.

**Result:** Redrafting America now presents a consistent visual identity across modern browsers and Apple touch surfaces.

### v0.3 — Full visual system rebuild

**Date:** *July 30, 2026*

**What changed:** Replaced the original dark theme with a cream/navy/gold "constitutional paper" palette, rebuilt across all pages. Introduced the Official Seal as a featured visual element (mission page). Reworked the Lexicon and Citizen Portal images to sit natively on the page instead of framed as light boxes inside a dark theme. Added a custom, on-brand 404 page (ported from the original site's tagline library, rebuilt without any React/Next.js dependency, with a real working minimal site search replacing a non-functional one). Version indicator advanced from v0.2 to v0.3.

**Why:** The project's most "official" visual assets — the Seal and the Constitutional Lexicon — were already built in a cream/navy/gold register, deliberately evoking an actual founding document. The site's dark theme, chosen early for a landing page, had never been checked against that instinct. Once compared side by side, the parchment palette was the more authentic register for a document claiming constitutional weight — and it was a comparatively cheap rebuild at four pages, versus a costly one after fifteen Constitution Articles existed in the old palette.

**Result:** Visual consistency across the project's key assets for the first time. Established as the site's standing design default going forward — new work starts from this palette; deviation requires a deliberate reason, not a default drift. (The dark theme's source remains recoverable in git history — worth tagging explicitly if it isn't already, so it's a named bookmark rather than something to go hunting for later.)

### v0.2 — Structural correctness, Careers, Cultural Influences

**Date:** *late July 27, 2026*

**What changed:** Fixed a CSS specificity bug that had been silently breaking hero-text centering on two pages. Rebuilt the Careers page from an old, mismatched draft (a 24-role corporate C-suite listing) into an accurate reflection of the org's real governance structure — President, VP, Secretary, Treasurer, and seven Directors, mapped directly from the Eleven Pillars leadership chart. Added the Cultural Influences page, deliberately built against a static JSON data file instead of reviving the old Supabase connection. Standardized header, footer, and navigation across all pages (sticky footer, consistent nav grouping, mobile hamburger menu). Added a background music feature with session-based random track selection.

**Why:** Early pages had drifted out of sync as each was built somewhat independently. The original Careers content, inherited from the old site, described positions and titles that didn't match a pre-formation, all-volunteer nonprofit — corrected once the organization's real leadership structure existed on paper. Cultural Influences became the first concrete test of the "does this actually need a database" question — and the answer was no.

**Result:** A visually and structurally consistent site across all pages; a Careers page that's honest about the organization's actual current stage; a Cultural Influences page with zero ongoing infrastructure dependency.

### v0.1 — Initial static landing page

**Date:** *July 25, 2026*

**What changed:** Replaced the prior Next.js/Supabase/Cloudflare codebase with a from-scratch static HTML homepage and mission page. Established the site's first visual identity (dark background, amber/gold accents).

**Why:** The prior project needed a full restart — the organization relocated its legal home from NC to PA, and the existing codebase was unfinished and entangled with infrastructure (a Supabase project, an old Vercel deployment) that no longer matched the org's actual setup. A clean restart was judged easier than untangling the old one.

**Result:** Site live on Vercel, under a properly organized GitHub organization (`redrafting-america`), with four private repos (`bylaws`, `constitution2`, `phone`, `website`) replacing a scattered personal-account setup.

---

## 6. Roadmap — v1.0 (Constitution Launch)

The defining event of v1.0: **publishing all 15 Articles of Constitution v2.0, one per week, each paired with its Explainer.**

- **Migrate to a static site generator (Astro).** Four hand-copied HTML files was manageable; fifteen-plus paired Article/Explainer documents plus an ongoing blog is not, without a shared template. Astro ships zero JavaScript by default, keeping the current site's performance profile while solving the duplication problem.
- **Constitution index page** — a single table of contents showing all 15 Articles, published and upcoming, each cross-linked to its Explainer.
- **Permanent URL structure**, decided in advance: `/constitution2/article-i` through `/constitution2/article-xv`, `/explainers/article-i` and so on — stable from day one, since these will eventually anchor Digital Constitutional Convention discussion threads.
- **Blog**, with its own template and an auto-generated RSS feed, doubling as the announcement channel for each week's Article release.
- **Migrate the four existing pages** (Home, Mission, Careers, Cultural Influences) into the same Astro structure, rather than leaving them as legacy files outside the new system.
- **Donation infrastructure**, once the IRS determination letter exists (which unlocks nonprofit-rate pricing across every payment platform under consideration) — cards, PayPal, and Apple Pay bundled under **Givebutter**, selected over Zeffy and Donorbox on cost-and-features grounds (comparable $0-by-default cost to Zeffy, but with the ability to disable donor tip-prompting entirely, plus a stronger built-in feature set). Zelle was evaluated separately and ruled out (no receipting, inconsistent bank support, no real cost advantage worth the gap).
- **Analytics**, likely Plausible or similar — the one piece of the original 2025 stack that was right-sized from the start.
- **Add "Contributors" and "Maintained By" sections to this README** — deliberately deferred until v1.0.

## 7. Roadmap — v2.0 (Digital Constitutional Convention)

Everything requiring real accounts, sessions, and live user interaction is scoped here, deliberately kept out of v1.0:

- **Account system** — sign-in, citizen profiles, an achievements/reputation layer, a "Jury Dashboard" concept for structured moderation participation. Identity verification, if built, uses a real KYC-style vendor (Stripe Identity, Persona, ID.me) — not a low-dollar charge, which verifies a working card, not a person, and is itself a known fraud-testing technique.
- **The Digital Constitutional Convention** (formerly referred to as "Town Hall") — structured public deliberation on the Constitution, deliberately modeled closer to Wikipedia's ArbCom than to a social media comment section: elected/trusted moderators operating through a structured process with evidence and a right of response, not raw up/down votes deciding outcomes. Design principles established so far: reading stays open to everyone (matching the project's transparency principle), only verified accounts can post; trust/reputation accrues over time rather than every privilege gating on the initial signup step alone; and a non-volunteer legal backstop (staff or board) exists behind the community process, since the organization carries legal exposure for the platform regardless of how moderation is distributed. Built as its own separate system — most likely Discourse or similar — linked to and embedded within Article pages, not merged into the main site's codebase.
- **Dark/light theme toggle** — the original dark theme remains available in git history and could become one half of a real toggle later. Not built by default, since the parchment palette is the project's actual visual identity, not one of two equal options.
- **Color-coded wayfinding** — tinting the breadcrumb bar to match whichever content section a visitor is in, inspired by the original site's sidebar navigation. Genuinely cheap to build and doesn't strictly require waiting for v2.0 — worth pulling forward into v1.0 if there's room, listed here only because it was never explicitly greenlit.
- **Category-based mega-navigation** — a six-category dropdown navigation system (About, Constitution, Learn, Community, Media & Press, Get Involved), inherited conceptually from the original site design. Deferred until real content exists across *all six* categories, not just Constitution — a mega-menu built today would mostly point at empty categories.
- **Approved information-architecture clarification (August 1, 2026):** Newsroom replaces the earlier "Media & Press" label. Community participation remains a v2.0 Convention concern and is not scaffolded in the prelaunch informational site.
- **Superseding category clarification (August 1, 2026):** Community is now scaffolded as a public information category for the Blog, future official social channels, events, partners, and the forthcoming Town Hall. This does not open pre-Convention constitutional proposals or public deliberation; those functions remain deferred to the Digital Constitutional Convention.
- **Possible revival of the animated Constitution presentation concept** — a glowing, book-opening reveal for the Constitution index page. Scoped as real craft work, not core infrastructure; a candidate for a v1.1 polish pass once the weekly publishing rhythm is established, rather than a launch-day requirement.

---

## 8. Deploying (Vercel)

1. Push this repo to GitHub under the `redrafting-america` org.
2. In Vercel: New Project → Import → select this repo, scoped to the org (not a personal account — private-org repos require a Vercel Team).
3. Framework preset: **Other**. No build command — it's static HTML (until the Astro migration lands; update this section when it does).
4. Deploy. Attach both `www.redraftingamerica.org` and `redraftingamerica.org` under project Settings, with `www` serving production and the apex redirecting permanently to `www`.
5. When the active public URL set changes, update `sitemap.xml`, deploy it, and submit `https://www.redraftingamerica.org/sitemap.xml` through Google Search Console and Bing Webmaster Tools.

## 9. Editing Conventions

- Every page currently carries its own copy of the shared header/footer/CSS — a known, temporary state of affairs pending the Astro migration. Until then, cross-page changes (nav links, palette, version pill) must be applied to every file individually.
- Customer-facing content belongs under the appropriate subject folder in `pages/`; only the homepage and host-required error page remain at the website root.
- Use root-absolute internal references such as `/assets/images/seal.png` and `/mission.html`. Do not calculate paths with chains of `../`; pages may move deeper as Articles and Explainers are added.
- **Superseding local/server compatibility rule (August 1, 2026):** The preceding root-absolute rule is retained only as history and must no longer be followed. Every HTML file declares a depth-appropriate relative `<base>` address that resolves to the website root. Internal references then use project-relative physical paths without a leading slash, such as `assets/images/seal.png` and `pages/about/mission.html`. This works both when files are opened directly and when the site is deployed.
- Fragment links on pages that use `<base>` must name the physical page before the fragment—for example, `pages/about/mission.html#opening-vision` rather than `#opening-vision`. Bare fragments resolve against the base directory and can open a local folder instead of the intended section.
- When a page moves to a different folder depth, update its `<base>` value and validate all local graphics, navigation targets, and fragments before publication.
- Preserve established public URLs through `vercel.json` rewrites when moving a source file. Filesystem organization must not silently break bookmarks, RSS entries, canonical URLs, or search results.
- Place shared media, data, styles, and scripts under `assets/` by type. A resource belongs next to a page only when it is truly unique to that page and will never be shared.
- When Cultural Influences changes, update both `assets/data/cultural-influences.json` and its equivalent local-compatible `assets/data/cultural-influences.js`, then validate that their data is identical.
- Draft only the files actively being changed in `site-work/`. After a draft is approved and published, remove that published draft while leaving unrelated work in progress intact.
- Archive only meaningful numbered releases, using the agreed page-folder and `pagename-vX.Y-YYYYMMDD.ext` naming convention. Archived files are read-only.
- Design tokens (colors, fonts) are CSS custom properties at the top of each page's `<style>` block.
- The permanent stacked header wordmark is centralized in `assets/styles/brand-lockup.css`. Adjust its icon and typography together so their visual heights remain aligned, and keep the stylesheet linked after page-specific styles so the shared lockup remains consistent.
- Music-enabled pages place `#music-toggle` and `#bg-audio` inside a final `.footer-music` element within `.footer-inner.has-music`; the header retains only the centered status pill and right-aligned mobile menu control.
- Images are pre-resized and compressed for web before committing; originals are not kept in this repo.
- The version pill in the header is updated by hand with each meaningful release — see §5 for the convention (`vX.X - STATUS`, casing typed directly rather than via CSS transform).

## 10. Article and Explainer Content Model

Every published constitutional Article and Explainer uses a stable permanent URL and a paired identifier. Working templates live in `templates/constitution-article.html` and `templates/constitution-explainer.html`; template files are not public content and remain excluded from search indexing.

### Article requirements

- Article number and title
- Permanent slug
- Status: Draft, Under Review, Revised, or Published
- Current version, first publication date, and latest revision date
- Plain-language summary clearly distinguished from official text
- Complete official Article text with stable section and clause numbering
- Approval authority and status
- Permanent link to the paired Explainer
- Link to the relevant constitutional comparison
- Dated revision history describing every material change and its authority
- Related Drafting Room papers where useful

### Explainer requirements

- Paired Article number, title, and permanent link
- Status, version, publication date, and latest revision date
- **What the Article means:** operation, scope, powers, limits, rights, and intended effect
- **Why this direction:** the legal, historical, institutional, and policy reasoning behind the text
- **Sources and evidence:** citations embedded directly in the relevant Explainer
- Material alternatives, tradeoffs, foreseeable objections, and limitations
- What the Article preserves, changes, adds, or removes relative to the current Constitution
- Dated revision history coordinated with any revision to the paired Article

### Publication rule

An Article and its Explainer are treated as a pair. Neither should be added to public navigation until both have approved content, working cross-links, complete version metadata, and a validated revision record.

## 11. Documentation Boundary

The two top-level README files have intentionally different responsibilities:

- `/README.md` at the project root is the organization-wide orientation document. It contains the mission, workspace folder map, current priorities, sources of authority, working conventions, and public contacts.
- `website/README.md` (this file) documents the public website: its goals, physical structure, technical choices, release history, roadmaps, editing rules, and approved content model.

Project-wide information should not be duplicated here unless it directly affects website operation or publication. Website-specific technical and release material should not be copied into the project-root README; the root document should link readers here instead.
