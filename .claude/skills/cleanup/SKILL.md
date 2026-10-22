---
name: cleanup
description: >
  Post-merge teardown: confirm the PR or MR merged, capture memory, switch the
  primary checkout to the base branch, and delete the branch and every worktree
  on it. Invoking it is the go-ahead; the merged-check is the guard. Docs and
  plan archiving are not here; they belong to the PR and plan skills. Triggers:
  "clean up", "PR merged — remove the worktree and branch", "end of session".
---

# Post-merge cleanup

Invoking this skill means the branch's work is merged and everything attached to
it can go. Don't ask for confirmation; the merged-check in step 1 is the guard.

Repository values live in `cleanup.config.json` beside this file. If it's absent
or missing a key, read `CONFIGURE.md` beside this file and follow it first.
Reach the forge the way the repository's agent instructions say, including any
sandbox exception or VPN. If it's unreachable, step 1 can't run, so stop.

## 1. Confirm the merge

```bash
git worktree list                                                # first line is the primary checkout
gh pr list --head <branch> --state all --json number,state       # github: want MERGED
glab mr list --source-branch <branch> --all                      # gitlab: want merged
```

Stop unless the newest request for the branch merged; a reused branch name can
have several. Trust the forge, not git ancestry: squash and rebase merges land
new SHAs, so `git branch --merged` calls merged branches unmerged, and
`git branch -d` succeeds on any branch matching its own upstream.

The cleanup set is that branch, every worktree under `worktreeRoot` that has it
checked out, and any worktree or branch this session spawned from it. Never
touch the primary checkout, `baseBranch`, or a worktree outside `worktreeRoot`;
report one of those rather than removing it. Ask only if ownership of one is
unclear.

## 2. Capture memory

Memory lives outside the repo, so no branch or commit is involved.

1. Read `MEMORY.md` first. A new fact is usually a new case of a rule already
   filed.
2. Fold before adding: update the covering entry and retitle it by the rule.
   Write a new file plus a one-line pointer only when nothing covers it.
3. Skip what the code, git history or the PR already records.
4. If a fact belongs to two or more entries, run a memory-consolidation skill if
   one is available.

## 3. Switch to the base branch

```bash
git -C <primary> switch <baseBranch> && git -C <primary> pull --ff-only
```

If you're inside a worktree in the set, `cd <primary>` first.

## 4. Remove the worktrees

For each worktree in the set:

```bash
git -C <path> status --porcelain     # must be empty
git -C <path> log --oneline @{u}..   # must be empty
git worktree remove <path>
```

Stop and report if either check prints anything; that is unsaved work. `--force`
is only for ignored dependencies and build output. Finish with
`git worktree prune`. A detached-HEAD worktree has no branch, so skip it in
step 5.

## 5. Delete the branches

```bash
git branch -D <branch>              # safe: step 1 proved the merge
git push origin --delete <branch>   # "remote ref does not exist" means auto-delete got it
```

## 6. Archive sessions (optional)

If the host exposes session management, archive sessions whose PRs merged.

## Report

One line per artifact removed, plus any memory written or updated.
