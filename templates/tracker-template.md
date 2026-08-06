# Company Tracker: {{SEARCH_NAME}}

Tracks which employers have already been checked, so future research rounds don't repeat work.
Target profile: {{TARGET_PROFILE}} (e.g. "recent CS master's graduate, junior/associate/trainee roles, no internships/apprenticeships, no senior/lead titles").
Region / scope: {{REGION}}.

Last updated: {{DATE}} (Round {{N}})

## Companies with a listing currently in data/jobs.json

{{comma-separated list of companies with at least one verified, active listing}}

## Checked, currently no matching opening (don't re-search, but worth a re-check later)

{{Group by rough category — Konzerne/large employers, consultancies, smaller software firms, public sector, etc. One line per company with a short reason, e.g. "Firma X (Stadt) — nur Senior-Rollen".}}

## Technically unreachable this round (JS-only career site, bot protection, DNS error, etc.)

{{List companies whose career page could not be read with the tools available. Note *why* — this tells the next round whether it's worth retrying with a browser tool.}}

## Excluded categories / policy notes

{{Anything the user has explicitly ruled in or out, e.g. "no bootcamp/retraining programs", "no IT-security focus", "include borderline listings without a Junior title if no multi-year-experience requirement is stated".}}

## Candidates for the next round

{{New companies identified (via job-board mining, Wikipedia company categories, career-fair exhibitor lists, meetup sponsor lists, etc.) but not yet checked for openings. This is what the next round should start from.}}

---
### Why this file exists

Every research round should:
1. Read this file first — never re-search a company already listed above.
2. Update it incrementally (after each company, not just at the end) so a crashed/rate-limited run doesn't lose progress.
3. Add a new "Round N" note at the top with the date and what changed.

See `SKILL.md` for the full verification rules (never fabricate a URL, always check the experience-level wording, etc.).
