---
name: pr
description: >
  Use this skill when the user asks to create a pull request, open a PR, or ship
  the current branch on GitHub. Handles commit + push + `gh pr create`
  end-to-end using the repository's commit convention and PR template, lands the
  docs the branch owes, then waits for CI, decides whether the branch has earned
  a Copilot review and requests one if so, runs the adversarial and editorial
  reviewers where the branch warrants them, and answers what they report.
allowed-tools: [Bash, Read, Edit, Agent]
---

# Create a Pull Request

Repository values live beside this file: `pr.config.json` for machine-readable
keys and `pr.config.md` for prose, under fixed headings. If either is absent or
incomplete, read `CONFIGURE.md` beside this file and follow it first. Otherwise
read both, including the `## Gotchas` section, then start at Step 1. Chain
`activate &&` before every project command if it's set.

Before committing, run each `## Preflight` command whose condition the diff
meets. Don't run what `## Git hooks` already covers. CI runs after the push, and
Step 6 reads it.

## Step 1 — Inspect branch state

In parallel: `git remote -v`, `git status`, `git branch --show-current`,
`git diff`, `git diff --staged`, `git log --oneline origin/<baseBranch>..HEAD`.
Stop if the remote isn't GitHub.

Stop and ask if the branch is `baseBranch`, if untracked files look unrelated
(env files, build artifacts, anything outside the diff), or if the lockfile
changed without a dependency change. That last one is stale churn from another
branch: check the lockfile out and reinstall.

**Is the branch stacked on another open PR?** It is when that PR's head is in
this branch's history and not yet in `baseBranch`:

```bash
git fetch origin -q
me=$(git branch --show-current)
gh pr list --state open --json number,headRefName --jq '.[] | "\(.number) \(.headRefName)"' |
  while read -r n ref; do
    [ "$ref" = "$me" ] && continue
    git merge-base --is-ancestor "origin/$ref" HEAD 2>/dev/null &&
      ! git merge-base --is-ancestor "origin/$ref" "origin/<baseBranch>" && echo "#$n $ref"
  done
```

If one prints, it's the parent; if several print, the parent is the one the
others are ancestors of. Stack on it rather than targeting `baseBranch`, so the
PR's diff holds only this branch's commits. From here on, `<base>` is the
parent's branch for a stacked PR and `baseBranch` otherwise.

## Step 2 — Parse the branch name for commit type

Follow `## Commit convention`. Where the branch prefix names a type, it's a
hint; the diff decides.

## Step 3 — Stage and commit

**Docs this branch owes.** Only this step and Step 8 ask the doc questions.
Answer each against the diff:

- **Does a plan advance?** Update its status and step boxes, per `planSkill`'s
  section on advancing a plan. If `planSkill`'s `store` is `github`, those edits
  wait for Step 5, once the PR has a number.
- **Does this branch close the plan's last open step?** Close it per
  `planSkill`'s section on closing a plan: in `repo`, the archive move goes in
  this commit; in `github`, the Step 5 body carries `Closes #N`.
- Each question under `## Doc obligations`.
- **Did a correction reveal a mistake that could recur?** Add it to `lessons`.
- **Does any other doc restate what changed?** Grep the vocabulary of the fact
  you made false. This catches what the list above can't.

**Commit.** Stage files by name, never `git add -A`, and skip anything
sensitive. Add a body only when the why isn't obvious.

```
git commit -m "$(cat <<'EOF'
<subject>

<optional why>

Co-Authored-By: Claude <your current model name> <noreply@anthropic.com>
EOF
)"
```

Never `--no-verify`. If a hook fails, fix the cause and make a **new** commit; a
failed hook created no commit to amend. Don't reword a message to dodge the
check or unstage the offending file. If a commit was suspiciously fast, the
hooks may not be installed; `worktreeSkill` has the check.

## Step 4 — Push

`git push -u origin <branch>`. After a local rebase use `--force-with-lease`,
never `--force`, and ask first if the branch has shared history. From a detached
worktree, push to a fully-qualified ref; `worktreeSkill` has the form. If a push
hook fails, fix the cause and push again, as in Step 3; never `--no-verify`.

## Step 5 — Create the PR

Read `template` first. Its comments are the rules for the title and each
section.

```
gh pr create --base <base> --assignee @me --title "<title>" --body-file <path>
```

A stacked PR's body names its parent where the template puts notes for the
reviewer. If `gh stack --version` succeeds (the
[`github/gh-stack`](https://github.com/github/gh-stack) extension), link the PR
into the parent's stack after creating it:

```
gh stack link <parent's number> <n>
```

If that succeeds, the body tells the reviewer to merge with
`gh stack merge <n> --squash --yes`, which merges the parent with it, each as
its own squash commit; add that with `gh pr edit <n> --body-file <path>`. If the
parent merges on its own, `gh stack checkout <n>`, `gh stack rebase`, then
`gh stack push`.

Without `gh stack`, the body says to merge the parent first. GitHub retargets
this PR to the parent's base only when the parent's branch is deleted. If the
parent squash-merges, this branch still carries the parent's original commits:
rebase it with `git rebase --onto origin/<parent's base> <parent's old tip>` and
push with `--force-with-lease` before it merges.

Write the body to a scratch file with the template's sections, filled in and
with its comments removed.

Once the PR exists, update the issue of any plan kept in GitHub that Step 3
found this branch advances, per `planSkill`.

## Step 6 — Wait for CI and fix what it reports

`## CI` says what runs. Finish this step before requesting a review, so the
review sees a passing diff.

```
gh pr checks <n> --watch --fail-fast
```

⚠️ **An instant green is the previous head's.** Real runs take a minute or more.
Before trusting one, confirm `headRefOid` matches `git rev-parse HEAD` and the
run ids are new:

```
gh pr view <n> --json headRefOid,statusCheckRollup \
  --jq '.headRefOid, (.statusCheckRollup[] | "\(.name // .context) \(.conclusion // .state) \(.detailsUrl)")'
```

On a failure, `gh run view <run-id> --log-failed`, then check the fixes under
`## CI`. Fix the cause and push; the new run cancels the old. Never weaken a
check to pass it; `checkBar` is the bar for changing one. Don't hand back while
a check is red or running. If a run sits queued for minutes, say so with the
URL. If a stacked PR gets no run at all, the workflow probably filters
`pull_request` by base branch; say so rather than calling it green.

## Step 7 — Get the reviews and answer them

Collect the changed paths first; every reviewer below decides from this list,
judged by the paths, not the branch prefix:

```bash
git fetch origin <base> -q && git diff --name-only origin/<base>...HEAD
```

### Has this branch earned a Copilot review?

Skip the Copilot request if `review.copilot` is `null` (say the PR has no
Copilot review), or if every path matches `review.skipWhenOnly` (say it's
**unreviewed by choice**). Either way, still decide on the reviewer agents
below. Everything else gets a request.

### Request it

REST silently drops bot reviewers and returns 200. Use the mutation, and record
the first command's count as the poll's baseline:

```bash
pr_id=$(gh pr view <n> --json id --jq .id)
gh pr view <n> --json reviews \
  --jq '[.reviews[] | select(.author.login == "<review.copilot.login>")] | length'
gh api graphql -f pr="$pr_id" -f bot='<review.copilot.botId>' -f query='
  mutation($pr: ID!, $bot: ID!) {
    requestReviews(input: { pullRequestId: $pr, botIds: [$bot], union: true }) {
      pullRequest { reviewRequests(first: 20) { nodes { requestedReviewer { ... on Bot { login } } } } }
    }
  }' --jq '[.data.requestReviews.pullRequest.reviewRequests.nodes[].requestedReviewer.login]
           | map(select(. == "<review.copilot.login>"))'
```

A list holding the login means it worked; `[]` means it didn't, whatever the
status code says. Don't re-read `reviewRequests` later, because it empties once
Copilot picks the request up. `reviews` is what answers whether one happened. An
empty answer means the requester has no Copilot licence or the quota is spent.
Neither is fixable by retrying, so record the PR as **unreviewed** and go to
Step 8.

The reviewer's id is a `BOT_…` node. `copilot-swe-agent` in `suggestedActors` is
the coding agent, and `requestReviews` accepts it without complaint.

### Then wait for it

Run this as a **background** Bash call, since foreground `sleep` is blocked:

```
before=<the count you recorded>
found=""
for i in $(seq 1 11); do
  read -r count ts <<< "$(gh pr view <n> --json reviews \
    --jq '[.reviews[] | select(.author.login == "<review.copilot.login>")]
          | "\(length) \(last.submittedAt // "-")"')"
  [ "$count" -gt "$before" ] && { found=$ts; break; }
  [ "$i" -lt 11 ] && sleep 30
done
[ -n "$found" ] && echo "review at $found" || echo "no new review after 5 minutes"
```

It counts rather than checking existence, so a re-request waits for the new
round. On a timeout, say so; don't call the PR clean, and don't skip Step 8. A
review can still arrive late.

### Run the adversarial reviewer in the same window

Spawn `review.adversarialAgent` when any path in Step 7's list matches
`review.adversarialWhenAny`. It builds the branch and tries to break it, which
finds what a diff review misses, and it costs no quota. Give it the PR number,
the repo path, and where a defect would hurt. Give it none of your conclusions
or Copilot's.

### Run the editorial reviewer in the same window

Spawn `review.editorialAgent` when any path in Step 7's list matches
`review.editorialWhenAny`. It reviews the docs and code comments the branch adds
or changes. Give it the PR number, the repo path and `<base>`, and none of your
conclusions.

### Answering findings

Read the review body as well as the inline comments. Copilot hides most findings
in a collapsed **Suppressed comments** block, often in a review with nothing
inline.

- `gh pr view <n> --json reviews` returns bodies, suppressed block included.
- `gh api repos/{owner}/{repo}/pulls/<n>/comments` returns inline comments and
  their ids.

The bot's login differs per surface (`Copilot` on inline comments), so match
with
`select((.user.login // .author.login) | ascii_downcase | startswith("copilot"))`.
Fetch from the PR you're changing, again after any rebase.

Verify every finding before acting, against `origin/<base>` when the branch is
behind. Then:

- **Agree:** fix it on this branch. If the fix widens scope or is a design call,
  ask.
- **Disagree:** reply with the command output that disproves it. For an inline
  comment use
  `gh api -X POST repos/{owner}/{repo}/pulls/<n>/comments/<id>/replies -f body='…'`;
  the PR number is required. For a suppressed finding, post a PR comment.
- **Both:** fix the real defect your way and say why you didn't take the
  suggestion.

A reviewer agent's findings have no thread to reply on. Fix the ones you agree
with, and name the rest, with your reason, in the hand-back.

Answer every finding in **one** push and go back to Step 6. Pushes don't trigger
reviews. Re-request only after substantive fixes, not after replies or
formatting. For a re-request, set `before` to the current round count and read
the newest review, which can carry a `**Previously missed (N)**` section. Check
that its `submittedAt` is later than your last push.

## Step 8 — Second docs pass, before you hand it back

If the review cycle changed code, re-ask Step 3's doc questions against what the
branch does now. Then ask what this branch taught that the next session would
otherwise rediscover:

- a check that failed for a reason the diff didn't show, or passed while proving
  nothing
- a finding that names a repeatable mistake
- a command or API that fails open or means something other than its name
- something you got wrong and corrected

Add each to `lessons` and push to **this** PR. Re-read CI, but don't re-request
a review for it. If there's nothing, say "nothing durable this time".

Hand back the PR URL, the check status, whether a review ran and what it raised,
and what you did with each finding.
