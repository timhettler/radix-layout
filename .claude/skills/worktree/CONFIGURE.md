# Configure the worktree skill

Writes `worktree.config.json` and `worktree.config.md` beside `SKILL.md`. Run
once, from the primary checkout (the first line of `git worktree list`).

```bash
git worktree list                                 # where worktrees live
git config core.hooksPath                         # relative means it resolves per worktree
git ls-files -oi --exclude-standard --directory   # every gitignored path present here
ls -a                                             # lockfile, runtime pin, hook manager
```

Work out the install command (prefer-offline, not strict offline, if the package
manager has it), the runtime pin and the command that activates it in a fresh
shell, and the hook manager and what installs it. Sort each gitignored path into
dependencies (install restores them), generated (find the command and what fails
without it), local config (to copy), or cache and tool state (leave it). Also
check:

- that formatters, linters, test runners and workspace globs ignore the worktree
  root. Probe each tool on a file inside one (e.g.
  `prettier --check <worktree>/README.md`). An entry in `.git/info/exclude`
  hides it from git only.
- whether `.claude/settings.json` hooks `cd` to `${CLAUDE_PROJECT_DIR}` (see
  `SKILL.md` § Gotchas)
- whether local services are shared by every worktree

Ask one question per decision that detection didn't settle, such as which
local-config files a worktree needs. Then write `worktree.config.json`:

```json
{
  "worktreeRoot": ".claude/worktrees/",
  "activate": "<command that activates the pinned runtime, or null>",
  "install": "<install command>",
  "generate": [
    { "command": "<command>", "provides": "<path> — <what fails without it>" }
  ],
  "hooks": { "installedBy": "<command>" }
}
```

`hooks` may be `null` and `generate` may be empty. Findings with no key of their
own go in `worktree.config.md` under `## Gotchas`, one bold-led bullet each;
keep the heading even when it's empty. Local-config files go in
`.worktreeinclude` at the repository root, in gitignore syntax; offer to create
or extend it. Show the user the result, then return to `SKILL.md` § 0.

## Porting

Never hardcode a repository path, command, port or file name in `SKILL.md`; it
belongs in `worktree.config.json`, `worktree.config.md` or `.worktreeinclude`.
To port, copy this directory without `worktree.config.*` and run it.
