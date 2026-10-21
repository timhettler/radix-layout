---
name: tech-plan
description: >
  Write a new tech plan, spin a deferred item out into its own plan, or archive
  a finished one, as a file in the repository or as a GitHub issue on a Project.
  Asks what the repo can't answer, then gets the name, masthead, links and
  cross-references right. The PR skill owns status, the step boxes and when to
  archive. Triggers: "write a tech plan", "plan this before we build", "spin
  that deferred item into its own plan", "capture that as a plan", entering plan
  mode on anything of three or more steps.
allowed-tools: [Bash, Read, Write, Edit, Grep, AskUserQuestion]
---

# Write, spin out or archive a tech plan

This skill owns the plan format: the layout, masthead and sections below, and
the templates in `templates/`. A repository supplies only its store, seeded
steps and neighbours, beside this file: `tech-plan.config.json` for
machine-readable keys and `tech-plan.config.md` for prose, under fixed headings.
If either is absent or incomplete, read `CONFIGURE.md` beside this file and
follow it first. Otherwise read both, including the `## Gotchas` section, then
start at § 0.

One plan per initiative. After creation, its status, step boxes and closing
belong to `prSkill`, on the PR that changes what's true. This skill writes no
implementation.

**`store` says where plans live.** In `repo`, a plan is a file under
`plans.active`, and its masthead holds its status. In `github`, a plan is an
issue in this repository, on the Project in `project`, and the Project's
`Status` field holds its status. A config with no `store` key is `repo`. Where
the two differ, each section below says so.

## 0. Is this a plan?

The bar is three or more steps, or an architectural decision. Below it, route
the work rather than dropping it, or it gets folded into the current change:

| It is…                                            | Destination                                           |
| ------------------------------------------------- | ----------------------------------------------------- |
| Multi-step work, or work that needs sequencing    | a plan — this skill                                   |
| A decision, where the decision is the deliverable | an ADR, in `destinations.adr`                         |
| One task this session's context has polluted      | a prompt written to a file, run in a fresh session    |
| A fact rather than work                           | `destinations.lessons`, if it clears that place's bar |

A plan whose honest outcome is "don't build it" is an ADR. A plan may carry a
decision and then do the work; it cites the ADR for the why.

**Refuse two things.** A second plan for an initiative that has one: extend it
or spin out of it (§ 6), and never suffix a slug to dodge a collision. And "plan
it and build it": write the plan and say the build is a separate session,
because the plan is the review gate.

```bash
# repo: the directory test settles the collision; archived slugs collide too.
test -d <plans.active>/<slug> -o -d <plans.archive>/<slug> && echo "EXISTS"
# github: closed issues collide too. Search is fuzzy, so read the titles.
gh issue list --state all --search '<slug> in:title' --json number,title,state
# The grep only finds who mentions it. A plan needn't contain its own slug.
grep -rln '<slug>' --include='*.md' .
```

## 1. Name it

In `repo`, a plan is `<plans.active>/<slug>/tech-plan.md`. In `github`, the slug
is the issue's title, and the issue number is what everything else cites. The
slug is kebab-case, two to five words, a noun phrase for the initiative:
`search-filters`, not `add-search-filters`. It's the grep handle § 10 depends
on, so if it's a substring of an existing slug, propose another and ask.

The active directory, or the Project's open items, is the open queue, not
in-flight work. A plan is also the cheap capture slot for a tangent, so
unstarted plans there are expected.

## 2. Ask once, batched

Derive what the repo answers first: slug collisions, whether a named blocker is
`complete` (`Done` on the board in `github`), what the last relevant PR did,
which plan already owns the question, what things are currently called.

Then ask the rest in one `AskUserQuestion` round, recommendation first, with "go
with those" a valid answer:

- **The problem and who feels it,** and what drives it, since that decides who
  has to agree.
- **The approach and the rejected alternative.** Without the rejection the
  decision gets re-proposed.
- **The success criterion,** written before the answer is known. It becomes
  `**Done means:**`. No criterion because the deliverable is a judgement means
  it's an ADR (§ 0).
- **What's out of scope.**
- **The owner.** Default `unassigned`; never write yourself or the requester in
  unbidden.

Ask where a claimed measurement would be checked, and for the output rather than
a description. **Never invent.** An unanswered field is `—` and gets named in
`## Open questions`.

## 3. Render

In `repo`, the plan is the file:

```bash
mkdir -p <plans.active>/<slug>
cp .claude/skills/tech-plan/templates/tech-plan.md.template <plans.active>/<slug>/tech-plan.md
```

In `github`, render `templates/tech-plan-issue.md.template` to a scratch file
instead; it becomes the issue body.

The `.template` suffix keeps formatters and linters off the source; the copy is
a real document. Then:

1. Delete the leading HTML comment. It's addressed to you.
2. Replace `{{DefaultSteps}}` with the items under `## Default steps`, or delete
   the line if there are none. In `github`, join each item onto one line, since
   a formatter may wrap them in the config.
3. Delete every seeded section you have nothing for (§ 5).
4. Substitute every other placeholder.

In `repo`, run `format` on the file if it's set. Never in `github`: `format`
rewraps prose, and GitHub renders each newline in an issue body as a line break.
Then check for leftover placeholders:

```bash
grep -nE '\{\{[A-Za-z][A-Za-z0-9-]*\}\}' <plan>
case $? in
  1) ;; # pass: grep read the file and found nothing
  0) echo "UNSUBSTITUTED PLACEHOLDERS ABOVE"; exit 1 ;;
  *) echo "grep could not read that file — check the slug"; exit 1 ;;
esac
```

Only exit 1 passes. An `if` would read grep's exit 2 (unreadable file) as clean.
A plan _about_ templates trips the gate on correct prose; read the hits rather
than widening the pattern.

In `github`, create the issue, put it on the Project, and set its `Status` (§
4):

```bash
url=$(gh issue create --title '<slug>' --body-file <scratch file>)
gh project item-add <project.number> --owner <project.owner> --url "$url"
gh project item-edit <project.number> --owner <project.owner> --url "$url" --field Status --value Todo
```

## 4. Masthead and body

The masthead is one bold run, not a list or front matter:

```
**Status:** not started **Owner:** unassigned **Started:** 2026-09-17 **PRs:** —
```

- `Status:` is `not started`, `parked` (deferred by decision), `in progress` or
  `complete`. Write only the first two. Waiting on a person is a `Depends on:`
  field, not a status.
- In `github`, leave `Status:` out. The Project's `Status` field holds it as
  `Todo`, `Parked`, `In Progress` or `Done`, and this skill writes only the
  first two.
- Unfilled is `—`, never `TBD` or omitted.
- Extra fields join the run: `Completed:`, `Depends on:`, `Blocks:`,
  `Predecessor:`. Past about five PRs, switch to a `| Field | Value |` table.
- Something true of the whole plan (an archive note, a scope change) goes in a
  `> **…**` blockquote under the masthead.

`## Problem` is two or three sentences. `## Approach` ends with `**Rejected:**`
and why. `## Constraints & decisions` holds settled scope, `**Done means:**`,
and any public API impact. Record how steps map to PRs only where that mapping
is part of the approach.

**Date every claim** with its measurement date or PR number. Unmeasured and
unsourced means it's an open question, not a constraint.

**Steps** are unchecked `- [ ]` items, each provably done and one paragraph with
bold lead-ins. A second paragraph means two steps. For multi-week work, group
steps under `### N — Name`; a group is a phase, a natural PR-series boundary and
a cold-pickup point.

Number steps freely inside the plan, but never cite one by number from outside
it, including in a commit or PR body. Annotate the masthead's `PRs:` instead:
`#210 — steps 1, 4 · #224 — step 3`.

## 5. Sections earn their place

Delete a seeded section you can't fill, and delete one whose job another section
has taken over. Two lists tracking the same thing drift apart. Optional sections
(`## Verification`, `## Not in scope`, `## Sequencing`, `## Outcome`) are added
when there's content, never seeded.

`## Open questions` need a human answer and should end empty. When one is
resolved, strike it through with the answer
(`~~**Q**~~ — **answered in #NNN: …**`) if someone could re-open it. Otherwise
delete it.

`## Deferred / follow-ups` is work deliberately cut. Prefer spinning an item out
(§ 6) over keeping this plan open for it.

## 6. Spinning an item out edits both ends

Read the source item in full. Write the successor as a normal plan with its
lineage in the masthead (`**Predecessor:**`, or
`**Blocks:** nothing. Spun out of …`), and a `## Problem` that says why now.
Then edit the predecessor's item to name the successor, keeping its short
reasoning. In `github`, that edit goes through § 9's issue-body edit. Both ends,
or neither.

## 7. Links

In `repo`, count depth from the plan's own directory. Write a sibling plan
through its tree (`../../<archive>/<other>/tech-plan.md`), never a bare
`../<other>/`: the active and archive trees are the same depth, so the bare form
silently resolves inside whichever one the file is in. Resolve every link you
wrote against the filesystem.

In `github`, cite another plan as `#N`. A relative link in an issue resolves
against the issue's URL, so link a file by its blob URL on the base branch, or
name it in backticks.

## 8. Hand off

In `repo`, ship it with `prSkill`. In `github`, the issue is live once created;
give the user its URL.

## 9. Advancing a plan

`prSkill` decides when; this section says where. In `repo`, the branch edits the
plan file: the masthead's `Status:` and `PRs:`, and the step boxes.

In `github`, the edits wait until the PR has a number. Tick the boxes the PR
completes and add it to `PRs:` in the issue body, then set `Status` to
`In Progress` if it isn't. An issue body has no merge, and the last write wins,
so fetch it right before you write. `printf` drops the newline `--jq` adds,
which would otherwise pile up at the end of the body, one per edit:

```bash
printf '%s' "$(gh issue view <n> --json body --jq .body)" > <scratch file>
# edit the scratch file
gh issue edit <n> --body-file <scratch file>
gh project item-edit <project.number> --owner <project.owner> \
  --url "$(gh issue view <n> --json url --jq .url)" --field Status --value 'In Progress'
```

A PR that advances a plan without closing it links the issue as plain `#N`,
which doesn't close it. If the PR closes unmerged or drops a step, untick its
boxes and take it out of `PRs:`.

## 10. Closing a plan

The PR that closes the last open step does it. If completion only became clear
after the merge, a docs-only PR does it in `repo`, and in `github` you close the
issue by hand.

In `repo`, it moves the plan:

```bash
git mv <plans.active>/<slug> <plans.archive>/<slug>
```

In `github`, the PR body carries `Closes #N`. GitHub acts on it only when the PR
merges into the default branch, so in a stack it goes on the PR that does.
Merging closes the issue, and the Project's "Item closed" workflow sets `Status`
to `Done`; if it didn't, set it with § 9's `item-edit`.

Either way:

- **Deferred work:** spin each live item out (§ 6), or say in the masthead where
  it went.
- **Outbound links (`repo`):** rewrite any bare `../<sibling>/` to the explicit
  form (§ 7) and resolve them.
- **Inbound links and claims:** `grep -rn '<slug>' --include='*.md' .`. In
  `github`, also grep for the issue's URL, and read the other issues and PRs
  that cite it as `#N`:

  ```bash
  gh api --paginate repos/{owner}/{repo}/issues/<n>/timeline \
    --jq '.[] | select(.event == "cross-referenced") | .source.issue.html_url'
  ```

  Fix the paths, then read each sentence. "Blocked on X" now points at finished
  work; repoint it to whatever owns that thing now, or drop it.
