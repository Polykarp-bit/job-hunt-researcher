---
name: job-hunt-researcher
description: Use this skill when the user wants to research and compile a verified list of open job positions — e.g. "find me junior developer jobs in X", "search for open positions at Y companies", "who's hiring for Z near me". Systematically searches job boards AND company career pages directly, verifies every single listing before including it (never fabricates a URL), tracks progress in a resumable file so long multi-round searches survive interruptions, and outputs a filterable, checkbox-trackable local HTML job board from a plain JSON file. Also use when the user wants to expand or continue a job search that already has a tracker file and/or a data/jobs.json from a previous run of this skill.
---

# Job Hunt Researcher

A repeatable process for building a **verified**, **de-duplicated**, **resumable** list of job openings — plus a
zero-backend HTML viewer to browse and track progress against it. Born out of a real job search (see
`examples/rheinland-2026/`) that went through ten-plus research rounds; this file is what that process looks like
distilled into something you can run again for any role, any region.

## Before you start: pin down scope with the user

Don't guess these — ask, or infer from the conversation, and write them into the tracker file so every later round
inherits them:

- **Role/field** (e.g. junior software developer, KI/AI developer, data analyst)
- **Seniority level wanted** — almost always "no senior/lead/head/manager titles," but confirm the *floor* too
  (fresh graduate vs. some experience OK vs. explicitly welcomes career changers)
- **Region and radius** (a city name is not enough — get a rough km radius or a list of acceptable neighboring towns)
- **Hard exclusions** — common ones: apprenticeships (Ausbildung), internships/working-student roles, retraining
  "bootcamp" programs disguised as jobs, a specific specialization the user does *not* want (e.g. "not IT security")
- **Output location** — where `data/jobs.json` and the tracker file should live in the user's project

Re-confirm scope changes explicitly stated mid-search (e.g. "actually leave the security roles that are already in
there, just stop adding new ones") — write the update into the tracker file immediately so it isn't lost.

## The core verification rule (never break this)

**Every URL that ends up in `jobs.json` must have been fetched and inspected by you, in this session, immediately
before you added it.** Never construct or guess a URL from a pattern (job-board ID parameters, especially, are not
sequential or guessable — treating them as such produces confident-looking dead links). If a listing can't be
verified, leave it out and say so, rather than including it with a caveat.

For every listing you verify, also check the **body text**, not just the title:
- A "(Junior)" title with "several years of experience required" in the description is not a junior role — exclude it.
- A generic title with no seniority word at all is fine to include if the description doesn't gate on years of
  experience — note it as a borderline case (see schema below) rather than silently treating it as equivalent to an
  explicit "Junior" listing.
- Watch for retraining/bootcamp programs marketed as jobs ("career change with paid training") — these are usually
  not real employment and should be excluded or flagged, not counted as a hit.

## Search strategy, in priority order

Job aggregators (Indeed, StepStone, LinkedIn Jobs, etc.) are the fastest way to get initial coverage, but they
overlap heavily with each other — after the first couple of rounds, mining them again mostly resurfaces the same
companies. Don't stop there. In rough order of diminishing effort-to-signal ratio:

1. **Aggregator keyword search** (StepStone/Indeed-style `/jobs/<keyword>/in-<city>` search URLs are usually
   reliably fetchable and contain working deep-links). Vary the keyword: the exact job title, "associate", "trainee",
   "graduate", "berufseinsteiger"/"entry-level", plus role-specific terms (devops, data engineer, SAP consultant...).
   Page through results (`?page=2`, `?page=3`) — don't stop at page 1.
2. **Company career pages, directly**, for every employer you already know is in-region — try these in order:
   - the obvious path (`<domain>/karriere`, `/careers`, `/jobs`)
   - `<domain>/sitemap.xml` or `/sitemap_index.xml` — often lists individual job-posting URLs even when the search
     page itself is a JS app
   - common ATS subdomains: `<company>.jobs.personio.de`, `<company>.jobs.personio.com`, `karriere.softgarden.de/...`,
     `jobs.smartrecruiters.com/<company>`, `<company>.wd3.myworkdayjobs.com` (try wd1–wd12)
   - if all of that fails and the page is a pure client-rendered SPA with no readable fallback, note it in the
     tracker as "technically unreachable" (not "no jobs") and fall back to finding that company's postings via an
     aggregator instead — a lower-confidence source is better than silently skipping a real employer.
3. **Genuine company discovery, independent of job-board presence** — this is what actually finds companies rounds
   1–2 miss, because it doesn't depend on who happens to be advertising *right now*:
   - Wikipedia's "Companies in <city>" category pages (and IT/software sub-categories where they exist)
   - chamber of commerce (IHK or equivalent) member/employer directories
   - university career-fair exhibitor lists, especially from technically-focused universities/campuses near the
     target region — these are literally companies that opted in to recruiting graduates
   - sponsor/partner lists of local tech meetups or conferences
   - regional "top employer" rankings (Kununu, Glassdoor, local business press)
4. **If browser automation is available** (not just a fetch-only tool), use it for the SPA-heavy sites that blocked
   step 2 — that's usually where the biggest remaining employers hide, precisely because their careers portal is
   too fancy to scrape simply.

## Make long searches resumable: the tracker file

Use `templates/tracker-template.md` as the starting point, saved as e.g. `research/company-tracker.md` in the user's
project. Read it in full before starting any new round. Update it **incrementally, after each company**, not just at
the end — background research sessions get rate-limited or hit usage caps mid-run more often than you'd like, and an
incrementally-updated file means that costs you nothing.

Each round should end with the tracker file holding:
- which companies now have a listing in `jobs.json`
- which were checked and came up empty (with a one-line reason — "only senior roles," "no IT presence in-region," etc.)
- which were technically unreachable, and why (so a future round with better tooling knows where to focus)
- an updated "candidates for next round" list

## Running it as multiple rounds / in parallel

For a thorough sweep, split by *source type* or *company category* (e.g. one pass for consultancies, one for
industrial employers, one for job-board keyword variants) rather than by raw company-name alphabetical order — each
pass can then specialize its search technique. If your environment supports background sub-agents, launching several
in parallel (each reading the same tracker file first, each updating it before finishing) works well — just make
sure each sub-task's instructions repeat the verification rule and the current scope/exclusions explicitly, since a
fresh agent has no memory of earlier rounds beyond what the tracker file tells it.

## Output: `data/jobs.json`

One file drives the whole viewer — copy `templates/jobs.template.json` as a starting point. Schema:

```jsonc
{
  "meta": {
    "title": "...",                 // browser tab title
    "eyebrow": "...",                // small label above the heading
    "heading": "...",                // main H1
    "description": "...",            // sub-heading paragraph — say what's excluded and how listings are verified
    "statsExtra": [ { "value": "42", "label": "companies checked" } ],
    "categories": { "junior": "Junior / Associate", "trainee": "Trainee / Graduate" },  // any keys you want
    "categoryOrder": ["junior", "trainee"],       // controls section order in the viewer
    "focusFilter": {                              // the default-active quick filter
      "label": "🎓 Junior & graduate-friendly",
      "categories": ["junior", "trainee"],
      "includeGradWelcome": true                  // also include jobs flagged gradWelcome from OTHER categories
    },
    "sources": [ { "label": "...", "url": "...", "extra": "(122 results)" } ],
    "directSources": [ "Company A, Company B — checked via their own career pages" ],
    "notes": [ "<strong>Methodology:</strong> ..." ],  // rendered as highlighted callout boxes; HTML allowed
    "footer": "..."
  },
  "jobs": [
    {
      "role": "Junior Backend Developer (m/f/d)",
      "company": "Example GmbH",
      "loc": "Cologne",
      "cat": "junior",           // must match a key in meta.categories
      "url": "https://...",       // required — the verified deep-link
      "note": "optional per-row caveat, shown under the title",
      "gradWelcome": true         // optional — badges the row and includes it in focusFilter even from other cats
    }
  ]
}
```

Nothing about the viewer is region- or role-specific — nulling out `meta` and swapping `jobs` repurposes the exact
same app for a different search from scratch.

## Rendering the viewer

Copy `templates/viewer/` (index.html, css/style.css, js/app.js) next to your `data/jobs.json` — the JS fetches
`data/jobs.json` relative to itself and renders everything from `meta`. Because it uses `fetch()`, open it through a
local static server, not as a `file://` URL (`python3 -m http.server`, `npx serve`, or a GitHub Pages deploy all
work). The viewer includes:

- category sections sorted by location
- a search box (matches company + location)
- category filter chips generated from `meta.categoryOrder`, plus a "focus" quick filter from `meta.focusFilter`
- a per-row checkbox ("already reviewed this one") persisted in `localStorage`, with a "hide checked" toggle and a
  live X/Y counter — lets the user work through the list over several sessions without losing their place

## Honesty over completeness

State plainly what was checked-and-empty, what's still unchecked, and what was technically unreachable — a shorter,
fully-verified list is more useful than a longer one padded with guessed links or unverified aggregator snippets.
When a round finds little, say so; that's signal that the search is converging, not a failure to report.
