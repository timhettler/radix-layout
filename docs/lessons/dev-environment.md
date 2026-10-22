# Dev environment

Running the repository's commands locally, including from a sandboxed agent
shell. The bar for an entry is in [README.md](README.md).

- **The story tests can't run in a sandboxed shell, and the error looks like a
  missing browser.** macOS Seatbelt stops Playwright launching Chromium, so
  `yarn test` fails with `kill EPERM` and a `SIGTRAP` exit before any story
  runs. The tempting fix, `playwright install chromium`, changes nothing,
  because the browser is installed. Run `yarn test` outside the sandbox. Turbo
  tasks fail in the sandbox for a related reason: Yarn writes to `/tmp/xfs-*`
  and gets `EPERM`.
