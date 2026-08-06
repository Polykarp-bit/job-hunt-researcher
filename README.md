# 🧭 job-hunt-researcher

A [Claude Code Skill](https://docs.claude.com/en/docs/claude-code/skills) that turns "find me some jobs" into a
disciplined, resumable research process — plus a zero-backend HTML viewer to track what you've already checked.

I built this while doing my own job search and kept running into the same problems every AI-assisted search hits:
confident-looking links that turn out to be dead, results that are just the same three job boards reshuffled, and no
memory between sessions of what's already been checked. This skill is the fix, written up so it works for any role
or region, not just mine — the actual results from my own search stay private; what's here is the reusable method.

## What it actually does

- **Never invents a URL.** Every listing is fetched and inspected before it's added — no guessed job-board IDs, no
  "should still be active" links.
- **Looks past job boards.** Aggregators (Indeed, StepStone, …) overlap heavily; after the first pass they mostly
  resurface the same companies. The skill also mines *company-independent* sources — Wikipedia's "companies in
  &lt;city&gt;" categories, chamber-of-commerce directories, university career-fair exhibitor lists, local tech-meetup
  sponsors — to actually find employers a keyword search never would.
- **Survives interruptions.** A plain-Markdown tracker file records what's been checked, what came up empty, and
  what's still queued — updated after every company, not just at the end, so a rate-limited or crashed run loses
  nothing.
- **Renders results as a small, real tool**, not a wall of text: filterable by category, searchable, and with a
  per-row checkbox (persisted in `localStorage`) to mark listings you've already reviewed.

## Live demo

`examples/demo/` is a small, entirely fictional dataset (made-up companies, made-up listings) that ships with the
repo purely to show how the viewer looks and behaves — filtering, search, category chips, the checkbox tracking.
It is not output from a real search; see [`SKILL.md`](./SKILL.md) for how real runs work.

**[→ Open the live demo](https://polykarp-bit.github.io/job-hunt-researcher/examples/demo/)**

## Using it as a Claude Code Skill

```bash
git clone https://github.com/Polykarp-bit/job-hunt-researcher.git ~/.claude/skills/job-hunt-researcher
```

Then in Claude Code, just ask for what you want — e.g. *"find me junior data engineer jobs around Munich, no
internships, master's-degree level"* — and the skill takes it from there: scoping questions, tracker file, verified
`data/jobs.json`, and a viewer you can open locally.

See [`SKILL.md`](./SKILL.md) for the full method (search strategy, verification rule, data schema).

## Using the viewer on its own

No build step, no dependencies — it's `fetch()` reading a JSON file.

```bash
cp -r templates/viewer my-search
cp templates/jobs.template.json my-search/data/jobs.json   # fill this in, or point the skill at it
cd my-search && python3 -m http.server 8000
# → http://localhost:8000
```

(`fetch()` needs an actual HTTP server — opening `index.html` directly as a `file://` URL will fail in most browsers.)

## Project layout

```
job-hunt-researcher/
├── SKILL.md                    # the skill definition Claude Code reads
├── templates/
│   ├── jobs.template.json      # empty data schema to start a new search from
│   ├── tracker-template.md     # resumable company-tracker starting point
│   └── viewer/                 # the HTML/CSS/JS viewer (generic, data-driven)
└── examples/demo/               # fictional sample data, just to show the viewer working
```

## Tech stack

Vanilla HTML/CSS/JS. No framework, no bundler, no dependencies — deliberately, so the whole thing stays copy-pasteable
and auditable in one sitting. Data and presentation are fully separated: `js/app.js` renders everything (headings,
filters, categories, table rows) from `data/jobs.json`, so the same three files work for a completely different
search without touching a line of code.

## License

MIT — see [LICENSE](./LICENSE).
