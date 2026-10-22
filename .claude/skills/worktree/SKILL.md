---
name: worktree
description: >
  Make a git worktree of this repository runnable and commit-safe. A fresh
  worktree checks out only tracked files, so its dependencies, generated files,
  local config and git hooks are all missing, and typecheck, the commit hook and
  the dev server fail until it's set up. Triggers: set up / run / commit from a
  worktree; a worktree fails typecheck or can't resolve a module; commits skip
  the hooks; work on a branch that's checked out elsewhere.
allowed-tools: [Bash, Read]
---

# Make a git worktree runnable

A worktree shares `.git` but none of the gitignored artifacts. Claude Code's own
worktree tools create under `.claude/worktrees/` and copy what
`.worktreeinclude` lists, but install nothing and generate nothing; this skill
does the rest. Run everything from inside the worktree, with `git -C <path>`
where cwd might drift.

Repository values live beside this file: `worktree.config.json` for
machine-readable keys and `worktree.config.md` for prose, under fixed headings.
If either is absent or incomplete, read `CONFIGURE.md` beside this file and
follow it first. Otherwise read both, including the `## Gotchas` section, then
start at § 0.

## 0. Create — detached, if the branch is checked out elsewhere

Prefer the host's worktree tools. `git worktree add <path> <branch>` fails with
`already used by worktree` when another checkout is on that branch. Create
detached and push to a fully-qualified ref:

```bash
git worktree add --detach <worktreeRoot>/<name> <ref>   # origin/<branch> or a SHA
git push origin HEAD:refs/heads/<branch>                # fast-forward only
```

From a detached HEAD, the first push to a branch the remote lacks needs
`refs/heads/`, or git refuses with `not a full refname`. For a new branch,
`git worktree add -b <branch> <path> origin/<base>` tracks the base; pass
`--no-track` so a later push can't target it.

## 1. Copy local config

Copy each file in the primary checkout that matches `.worktreeinclude` and is
missing here. Copy, don't symlink: a linked file is the primary checkout's, so
an edit here changes it there. Never print an env file's contents.

## 2. Install and generate

```bash
<activate> && <install> && <each generate command>   # drop `<activate> &&` when it's null
```

Never symlink dependencies from the primary checkout. Workspace package managers
give each package its own dependency directory, so a root symlink leaves the
rest unresolved. A real install from a content-addressed store takes seconds.

## 3. Verify the hooks

If `hooks` is set:

```bash
test -x "$(git rev-parse --git-path hooks)/pre-commit" && echo on || echo OFF
```

`OFF` means they aren't installed here: run `hooks.installedBy` and check again.
Don't probe with `git hook run`, which runs the hook and can rewrite staged
files.

## 4. Run and commit

Agent shells don't persist, so chain `<activate> &&` before every project
command, commits included, since hooks run under it. Run the dev command the
repository documents; if its port is taken, use another. Shared services are one
instance for every worktree, so a migration or seed run from here changes them
for all.

Stage explicit paths, never `git add -A`. A directory-form gitignore entry
(`node_modules/`) doesn't match a symlink of the same name, so any linked
directory shows as untracked. If a commit was suspiciously fast, re-run § 3.

## Gotchas

- **Hooks skip silently in a fresh worktree.** A relative `core.hooksPath` is
  shared config but resolves inside each worktree, where it doesn't exist until
  hooks are installed. Don't make it an absolute path into the primary checkout;
  that breaks when a sandbox allows only the worktree.
- **A stale or missing generated file reads as a real error.** It's gitignored,
  so `git status` stays clean while typecheck reports exports that exist in
  source as missing. Re-run `generate`; don't add a path alias.
- **`.git` is a file in a linked worktree,** so a script walking up for a `.git`
  directory lands on the primary checkout. Use `git rev-parse --show-toplevel`.
- **Agent hooks don't follow the worktree.** `${CLAUDE_PROJECT_DIR}` stays at
  the session's starting checkout, so a hook that `cd`s there checks the primary
  checkout. The worktree is the `cwd` field of the hook's input JSON.
- **A sandboxed `git worktree add -b` can half-fail.** It creates the branch,
  then fails on `could not lock config file` with a last line that reads like
  success. Trust `git worktree list`; clean up with `git branch -D` and
  `git worktree prune`. A sandboxed install can also fail with `EPERM`; rerun it
  outside the sandbox.

## Cleanup

After merge, use the repository's cleanup skill if it has one. Otherwise
`git worktree remove <path>`.
