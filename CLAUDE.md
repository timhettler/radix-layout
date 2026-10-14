# CLAUDE.md

Guidance for working in this repo. Keep it concise and current.

## What this is

`@timhettler/radix-layout` — Every Layout's layout primitives as Radix-style
React components; `lib/src/main.ts` is the list. The repo follows the shape and
conventions of `@timhettler/radix-card`: Yarn 4 workspaces, Turborepo,
Changesets, an ESM-only Vite build, Storybook as the test suite. Decisions are
in `docs/decisions/`.

## Toolchain

- **Node 22** (`.nvmrc`). A Node 18 shell breaks Vite 8. `nvm use` first.
- **Yarn 4** via `.yarn/releases`. Not npm or pnpm.

## Workspaces

| Workspace | Package                         | Role                                                  |
| --------- | ------------------------------- | ----------------------------------------------------- |
| `lib/`    | `@timhettler/radix-layout`      | the published library                                 |
| `docs/`   | `@timhettler/radix-layout-docs` | Storybook, and the test suite; also `docs/decisions/` |
| `config/` | `@timhettler/config`            | shared tsconfig / ESLint / Prettier                   |

## Commands

- `yarn lint` / `yarn typecheck` / `yarn build` / `yarn test` / `yarn format` (+
  `format:check`) via Turbo.
- `yarn workspace @timhettler/radix-layout check:package` — `publint` + `attw`.
  Run after any packaging change.
- `yarn workspace @timhettler/radix-layout-docs storybook` — dev server on 6006.
- First test run needs
  `yarn workspace @timhettler/radix-layout-docs exec playwright install chromium`.

## How a layout is built

- **Appearance is static CSS** compiled from `lib/src/scss/` by
  `lib/scripts/build-css.mjs` after `vite build`. Components write a class and
  `data-*` attributes only — never a `style` (ADR 0002).
- **The space scale is defined once**, in `lib/src/scss/_space.scss`, and
  mirrored by `lib/src/space.ts`. Add a step in both; the stories' vocabulary
  scrape fails if they disagree.
- **Each `data-*` axis has a runtime list** (`stackAligns`, `clusterJustifies`,
  …) and the prop type is derived from it. Keep it that way — the scrape
  compares the list to the compiled CSS.
- **Optional axes are omitted, not defaulted**, so the CSS class is the single
  definition of each default.
- **Emit a rule for every value, the default included**, so the scrape sees the
  whole axis.
- **Only public custom property defaults go in `@layer el.defaults`**; every
  layout declaration stays unlayered (ADR 0003). Each compiled file opens with
  `@layer el.defaults;` via `_layers.scss`.
- **A new layout must pass ADR 0001 § 1**: several declarations _and_ a failure
  mode a caller would hit. There is no `Box`, deliberately.
- **Packaging mirrors Radix**: `@radix-ui/*` primitives are regular,
  externalized dependencies, only `react`/`react-dom` are peers. `sideEffects`
  lists `**/*.css`.

## Testing

Behaviour is tested by the `play` functions in `docs/stories/`, run in Chromium
via `@storybook/addon-vitest`. Assert computed styles and measured geometry, not
just attributes — an attribute assertion passes with the CSS rule deleted. a11y
violations fail the run.

## Releasing

Every consumer-facing change needs a changeset (`yarn changeset`).

The repo is in Changesets **prerelease mode** (`.changeset/pre.json`, tag
`alpha`): versions come out as `0.1.0-alpha.N` and publish under the `alpha`
dist-tag. Breaking changes (for example, renaming the FPO space scale) are
expected until `yarn changeset pre exit` before 1.0.

## Writing

For what a teammate or consumer reads (docs, comments, commits, PRs, changesets,
issues), not chat replies or text written for a model (prompts, tool
descriptions, skills), where evals set the length. Write like a senior colleague
on Slack: plain, direct, complete sentences. Cut filler, not grammar.

- Lead with the answer or the change. No preamble, no recap.
- One reason per decision. Link the ADR that holds the rest.
- No headers or bullets under about five sentences, except in the PR shape
  below.
- Leave out what you didn't do, what you found fine, and caveats that wouldn't
  change the reader's next action.
- Don't report what CI runs. Report what you checked by hand, such as Safari or
  Firefox, and anything failing.

| Artifact     | Limit                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| PR           | About 8 lines, in the shape below                                      |
| Commit body  | 3 lines                                                                |
| Code comment | 1 line, for what the code can't say. JSDoc on exports is consumer docs |
| Issue        | The problem, what "done" means, one link                               |

A PR opens with the change in one or two sentences, no header. **Evidence**
follows: the issue link, acceptance criteria met or open, checks run by hand.
**Reviewer notes** come last: what to judge, or do after merge. Omit empty
sections. A comment runs longer only where a constraint needs several facts and
no ADR owns them.

**Stay true.** If an unrelated merge would make a sentence false, point at where
the fact lives or cut it. Describe the current state; backstory belongs only in
an ADR. Changesets are the exception: "removed" and "import from X instead" are
their job. In docs, never state a count the repo can answer: "`spaces` is the
list", not "the scale has 11 steps". In PRs and issues, keep a number only if it
changes the reader's decision.

Before you finish, scan for _now, no longer, previously, used to, instead of,
replaced, ported_ and rewrite any that narrate a change as current fact. Keep
only numbers that change a decision. If over budget, cut whole sentences.

> Adds `Stack` and `Cluster` with an `--el-space-*` scale a consumer can remap
> from any unlayered rule. Checked the remap in Safari with `styles.css` loaded
> before and after the override.
