# Documentation

Engineering docs that outlive a PR.

| Doc                                                          | What it covers                                    |
| ------------------------------------------------------------ | ------------------------------------------------- |
| [`decisions/adr/`](decisions/adr/)                           | Decisions and their reasons, frozen once accepted |
| [`lessons/`](lessons/README.md)                              | Mistakes that recur, by kind of work              |
| [`guidelines/code-comments.md`](guidelines/code-comments.md) | What a comment is for, and what to cut            |
| [`repo-settings.md`](repo-settings.md)                       | The GitHub settings this repository expects       |
| [`decisions/planning/`](decisions/planning/)                 | Plans, one directory each                         |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md)                   | Branching, PRs, merging, releases and the checks  |
| [`../CLAUDE.md`](../CLAUDE.md)                               | Commands and workflow rules for coding agents     |

## Where a new doc belongs

| If it's…                                       | Put it in                                            |
| ---------------------------------------------- | ---------------------------------------------------- |
| A decision someone will want the reasoning for | `decisions/adr/`, in the shape of the ones there     |
| A mistake someone already made                 | `lessons/`, if it meets [the bar](lessons/README.md) |
| A convention tooling can't check               | `guidelines/<topic>.md`, with a row above            |
| A convention tooling can check                 | A check, not a doc                                   |
| A deep-dive on one part of the system          | `<topic>.md`, with a row above                       |
| A plan, or who is doing what                   | `decisions/planning/`, through `tech-plan`           |

## Checked conventions

A convention a check enforces isn't restated in prose: add a case to the check.
A check has to be able to fail on something the diff doesn't already show. Ask
what change breaks the rule without a trace a reviewer would see, and what
someone does when it goes red. If the answers are "the diff shows it" and
"regenerate the file", it's a change detector, and it costs a step on every
change while catching nothing.

| Rule                                       | Enforced by                 |
| ------------------------------------------ | --------------------------- |
| Every table row renders as a row on GitHub | `scripts/check-markdown.ts` |
