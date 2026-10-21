# Contributing

How we branch, open PRs and merge. Setup is in [`README.md`](README.md), and
agent rules are in [`CLAUDE.md`](CLAUDE.md).

## Branch naming

`type/description`: a Conventional Commit type, then two to five words in
kebab-case, such as `feat/retry-failed-uploads`. The type is the change's
intent. The labeler reads it to label the PR, and commitlint holds each commit
to a type. A branch that skips the convention still merges, with no type label.
Commits are `type: subject`, with no scope. Never commit to `main`.

| Type       | For                                                  |
| ---------- | ---------------------------------------------------- |
| `feat`     | a new feature                                        |
| `fix`      | a bug fix                                            |
| `refactor` | restructuring with no change a user sees             |
| `perf`     | a refactor for performance                           |
| `test`     | tests only                                           |
| `docs`     | documentation only                                   |
| `ci`       | automation, workflows and deployment                 |
| `chore`    | anything else, such as dependencies and `.gitignore` |

## Pull requests

The PR template holds the rules for the title and body. Labels come from the
branch name and the changed paths; add one by hand only when no path implies it.
A PR merges by squash, so its title becomes the commit subject on `main`, which
commitlint never sees: write it as a Conventional Commit.

Before you merge, run the full set of checks, not only what you touched, and run
the thing you changed. Answer every review finding with a fix or a reply.

GitHub deletes the branch on merge. Because a squash lands a new commit, git
can't tell whether a branch merged: ask GitHub
(`gh pr view <branch> --json state`), never `git branch --merged`.

## Release process

[Changesets](.changeset/README.md) records a release intent as a file on the
branch that causes it, so the intent is reviewed with the diff and survives the
squash.

1. On a branch that changes a published package, run `yarn changeset`, pick the
   bump, describe the change for a consumer, and commit the file.
2. On merge, `release.yml` opens or updates a "chore: version packages" PR that
   bumps the versions and writes each `CHANGELOG.md`.
3. Merging that PR publishes to npm with the `NPM_TOKEN` secret, under the
   `alpha` tag while prerelease mode lasts (`CLAUDE.md` § Releasing).

A change without a changeset still merges, and ships with the package's next
bump.

## Formatting

Prettier owns style, so nobody reviews it. The pre-commit hook formats staged
files, and `format:check` in CI is the backstop. To exempt one block, put
`<!-- prettier-ignore -->` above it in markdown, or `// prettier-ignore` in
code.

## Checks

| When                     | What runs                                                    | Where                                     |
| ------------------------ | ------------------------------------------------------------ | ----------------------------------------- |
| every commit             | the formatter, then the linter, on staged files              | `pre-commit`                              |
| every commit             | commitlint                                                   | `commit-msg`                              |
| a push of a clean `HEAD` | build, typecheck, lint, the markdown check and tests         | `pre-push`, through `scripts/pre-push.ts` |
| every PR, and `main`     | build, typecheck, lint, the markdown check, format and tests | `.github/workflows/ci.yml`                |
| every PR                 | type and area labels                                         | `.github/workflows/labeler.yml`           |
| a push to `main`         | the version PR or the publish                                | `.github/workflows/release.yml`           |

The pre-push hook skips `format:check`, so CI is the complete set. `release.yml`
opens the version PR with `RELEASE_TOKEN`, a personal token, so CI and the
labeler run on it.
