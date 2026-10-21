# pr — repository config

The prose half of [`pr.config.json`](pr.config.json). The skill reads both;
Configure writes both; porting leaves both behind.

## Preflight

- **When a change touches packaging (`lib/package.json`, `lib/vite.config.ts`,
  exports):** `yarn workspace @timhettler/radix-layout check:package`. CI runs
  it too.

## Commit convention

Conventional Commits, `type: subject`, with `!` before the colon for a breaking
change. Dependabot's `build(deps):` is the only scope in use. Subject
imperative, lowercase after the colon, no period. Branches are
`type/description`.

## Git hooks

None yet.

## Doc obligations

- **Does a consumer see the change?** Add a changeset with `yarn changeset`. The
  repository is in prerelease mode, so a breaking change is expected and still
  needs one.
- **Does it decide something someone will want the reasoning for?** Add an ADR
  under `docs/decisions/adr/`.
- **Does it change how a layout is built?** Update `CLAUDE.md` § How a layout is
  built.

## CI

`Verify` in [`ci.yml`](../../../.github/workflows/ci.yml) runs install, `lint`,
`format:check`, `typecheck`, `build`, then `test` (Storybook play functions in
Playwright's Chromium) and `check:package`. `main` has no branch protection, so
a red check still merges. The usual fixes:

- `format:check`: `yarn format`, then commit.
- `test`: run
  `yarn workspace @timhettler/radix-layout-docs exec playwright install chromium`
  once locally, then `yarn test`.

## Gotchas

- **Scope every `gh` call to the repository's account:** prefix it with
  `GH_TOKEN=$(gh auth token --user timhettler)`, and never run `gh auth switch`.
  Run it outside the sandbox, where the keychain is readable.
- **Push with the same account's token:**

  ```bash
  git -c credential.helper= -c credential.helper='!f() { echo username=timhettler; echo "password=$(gh auth token --user timhettler)"; }; f' push -u origin <branch>
  ```
