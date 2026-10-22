# Configure the cleanup skill

Writes `cleanup.config.json` beside `SKILL.md`. Detect the values, ask only
about what detection didn't settle, and write it:

```bash
git remote -v                                        # github.com → gh; GitLab → glab
git symbolic-ref --short refs/remotes/origin/HEAD    # base branch, minus `origin/`
git ls-remote --symref origin HEAD                   # if the line above fails
git worktree list                                    # where worktrees live
```

```json
{
  "forge": "github | gitlab",
  "baseBranch": "main",
  "worktreeRoot": ".claude/worktrees/"
}
```

Show the user the config, then return to `SKILL.md` § 1.

## Porting

Never hardcode a repository value in `SKILL.md`; it belongs in
`cleanup.config.json`. To port, copy this directory without the config and run
it.
