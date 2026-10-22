# Dev environment

Running the repository's commands locally, including from a sandboxed agent
shell. The bar for an entry is in [README.md](README.md).

- **The story tests can't run in a sandboxed shell, and the error looks like a
  missing browser.** macOS Seatbelt stops Playwright launching Chromium, so
  `yarn workspace @timhettler/radix-layout-docs test`, or `vitest` run directly,
  fails with `kill EPERM` and a `SIGTRAP` exit before any story runs. The
  tempting fix, `playwright install chromium`, changes nothing, because the
  browser is installed. `yarn test` fails earlier, when Yarn under Turbo writes
  to `/tmp/xfs-*` and gets `EPERM`. Run either outside the sandbox.
- **A sandboxed `git switch -c <branch> origin/<other>` half-succeeds.** It
  creates the branch and checks out its files, then can't write the upstream to
  the shared `.git/config` and leaves `HEAD` on the old branch. `git status`
  then shows the other branch's whole diff as staged changes, which looks like
  stray work to commit or reset. Do neither:
  `git symbolic-ref HEAD refs/heads/<branch>` finishes the switch with a clean
  tree. Passing `--no-track`, or switching outside the sandbox, avoids it.
