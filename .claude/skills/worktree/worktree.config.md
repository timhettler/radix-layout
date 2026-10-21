# worktree — repository config

The prose half of [`worktree.config.json`](worktree.config.json). The skill
reads both; Configure writes both; porting leaves both behind.

## Gotchas

- **Run `yarn install` outside the sandbox.** The root `postinstall` runs husky,
  which writes `core.hooksPath` into the repository's shared git config.
- **Turbo builds `lib` before anything that needs it**, so a fresh worktree
  needs no generate step; `yarn typecheck` and `yarn test` build it first.
- **Playwright's Chromium is per machine,** in Playwright's per-user cache
  (`~/Library/Caches/ms-playwright` on macOS), so every worktree shares the one
  installed with
  `yarn workspace @timhettler/radix-layout-docs exec playwright install chromium`.
- **Prettier skips `.claude/worktrees/` through `.gitignore`.** ESLint and tsc
  run per workspace, and the workspaces are named, not globbed, so neither
  reaches into a worktree.
