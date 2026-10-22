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
