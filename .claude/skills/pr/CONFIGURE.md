# Configure the pr skill

Writes `pr.config.json` and `pr.config.md` beside `SKILL.md`. Detect first, ask
second.

```bash
git remote -v                                       # not GitHub? stop: use the repository's MR skill
git symbolic-ref --short refs/remotes/origin/HEAD   # base branch
ls .github/ .husky/ .claude/agents/ .claude/skills/ # hooks, reviewer agents, sibling skills
ls commitlint.config.* lint-staged.config.* 2>/dev/null; grep -n '"lint-staged"\|"commitlint"' package.json
t='^(\.github/|docs/)?pull_request_template(\.(md|txt)|/[^/]+\.md)$' # where GitHub reads PR templates
git ls-files | grep -iE "$t"                                          # this repository's
gh api 'repos/<owner>/.github/git/trees/HEAD?recursive=1' --jq '.tree[].path' 2>/dev/null |
  grep -iE "$t"                                                       # the owner's default
```

Read the CI workflows, the contributor guide, and the agent instructions for
what a branch must ship with. Ask one question per decision detection didn't
settle. Then write `pr.config.json`:

```json
{
  "baseBranch": "main",
  "template": "<path to the PR template>",
  "activate": "<runtime prefix, or null>",
  "planSkill": "<skill that owns plans, or null>",
  "worktreeSkill": "<skill for worktrees, or null>",
  "lessons": "<directory for durable lessons, or null>",
  "checkBar": "<doc that sets the bar for changing a check, or null>",
  "review": {
    "copilot": {
      "botId": "<BOT_… node id>",
      "login": "copilot-pull-request-reviewer"
    },
    "skipWhenOnly": ["<paths that don't earn a review>"],
    "adversarialAgent": "adversarial-reviewer",
    "adversarialWhenAny": [
      "<paths holding checks, guards, gates or generators>"
    ],
    "editorialAgent": "editorial-reviewer",
    "editorialWhenAny": ["**"]
  }
}
```

And `pr.config.md`, with these headings in this order; leave a section empty
rather than dropping its heading:

- `## Preflight` — only what no hook can decide, each command with when to run
  it.
- `## Commit convention` — the message format and subject rules.
- `## Git hooks` — what each hook runs, so the skill doesn't repeat it.
- `## Doc obligations` — questions to answer against the diff, each with where
  the answer goes.
- `## CI` — what runs, whether anything is required, and the usual fix per
  check.
- `## Gotchas` — anything else, one bold-led bullet each.

**Prefer a hook to a preflight.** A check whose condition is a path belongs in a
hook that derives the condition from the changed files, not in `## Preflight`
for the agent to judge. Where a check the branch needs has no hook, propose one
to the user as its own change rather than adding it here. Where a hook or
preflight check doesn't also run in CI, tell the user it is advisory: anyone can
skip a hook, so only CI enforces a check. Don't write a CI workflow from here.

Every repository gets a PR template. If neither search finds one, copy
`templates/pull_request_template.md` from this skill's directory to
`.github/pull_request_template.md`. Tailor its comments to the commit convention
and to `AGENTS.md` § Writing if there is one, and set `template` to its path. If
only the owner's `.github` repository has one, GitHub already applies it, and a
repository template would replace it for every PR: ask before adding one. If the
user keeps the owner's, set `template` to `null` and name its URL under
`## Gotchas`. If the repository has several, ask which one the skill fills. A
template that already exists is the repository's; leave it.

Always ask whether this repository requests Copilot reviews, whatever detection
found. If not, set `review.copilot` to `null`.

Every repository gets an adversarial and an editorial reviewer. Install each
template from this skill's directory that `.claude/agents/` doesn't already
have:

```bash
mkdir -p .claude/agents
for a in adversarial-reviewer editorial-reviewer; do
  test -e .claude/agents/$a.md || cp .claude/skills/pr/agents/$a.md .claude/agents/
done
```

In the adversarial reviewer, fill `## Verification setup in this repo` from what
you detected (the `activate` prefix, commands that need to run outside the
sandbox). In the editorial reviewer, fill `## Writing standard in this repo`
with the docs `AGENTS.md` § Writing links to, such as a code-comments guideline,
and name them rather than copying their rules. The reviewer checks against §
Writing, so without one it only checks for claims that drifted from the code:
suggest the user run `writing-setup`. Leave each agent's "clusters" section
empty for later runs to fill, and delete each leading comment. An agent that
already exists is the repository's; leave it.

`editorialWhenAny` defaults to `["**"]`, which runs the editorial reviewer on
every PR. Narrow it only if the user asks.

Show the user every file you wrote, then return to `SKILL.md` § Step 1.

## Porting

Never hardcode a repository path, command or convention in `SKILL.md`; it
belongs in `pr.config.json` or `pr.config.md`. To port, copy this directory
without `pr.config.*` and run it; `agents/` ships with it as the reviewer
templates, and `templates/` as the PR template.

When a run finds a repository-specific miss shape, add it to the installed
agent's `## Where misses cluster in this repo`, or for the editorial reviewer
`## Where bloat clusters in this repo`. A shape that would hold in any
repository belongs in the template under `agents/` here, and in each installed
copy's general list.
