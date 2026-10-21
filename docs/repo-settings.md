# Repository settings

These live in GitHub, not the tree: a clone doesn't carry them and grep can't
find them. Read the live values with `gh api repos/timhettler/radix-layout`
before trusting this page, and apply a row with its command. Most need admin
rights.

## Merging

| Setting                                    | Wanted     | Why                                                      |
| ------------------------------------------ | ---------- | -------------------------------------------------------- |
| `allow_squash_merge`                       | `true`     | One PR is one commit on `main`                           |
| `allow_merge_commit`, `allow_rebase_merge` | `false`    | Uniform history, so ancestry never reads as "merged"     |
| `squash_merge_commit_title`                | `PR_TITLE` | The PR title, a Conventional Commit, becomes the subject |
| `squash_merge_commit_message`              | `PR_BODY`  | The commit body is the PR's short description            |
| `delete_branch_on_merge`                   | `true`     | Branches don't outlive their PR                          |

```bash
gh api -X PATCH repos/timhettler/radix-layout -F allow_squash_merge=true -F allow_merge_commit=false \
  -F allow_rebase_merge=false -f squash_merge_commit_title=PR_TITLE \
  -f squash_merge_commit_message=PR_BODY -F delete_branch_on_merge=true
```

## Protecting `main`

Optional when one person works here. To require a PR and a passing `verify`, and
block force-pushes and deletion:

```bash
gh api -X PUT repos/timhettler/radix-layout/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": false, "contexts": ["verify"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

The version PR that `release.yml` opens with `GITHUB_TOKEN` gets no `verify`
run, so an admin merges it past this rule.

Read the rules rather than the `protected` flag, which any ruleset sets:
`gh api repos/timhettler/radix-layout/branches/main/protection`, and
`gh api repos/timhettler/radix-layout/rulesets`. Some plans offer no protection
on a private repository; the first command then fails with a 403.

## Actions

Allow GitHub Actions to create and approve pull requests, or the release
workflow pushes its branch and then fails to open the version PR:

```bash
gh api -X PUT repos/timhettler/radix-layout/actions/permissions/workflow -F can_approve_pull_request_reviews=true
```

## Labels

The labeler can't create a label, so a missing one fails its run. These need
write access, not admin. Create only those `gh label list` lacks: `bug`,
`documentation` and `dependencies` came with the repository. `gh label list`
shows 30 by default, so pass `--limit 100` before calling one absent.

```bash
gh label create 'feature' --repo timhettler/radix-layout --color 1d76db --description 'A feat/ branch'
gh label create 'chore' --repo timhettler/radix-layout --color cfd3d7 --description 'Nothing a user of the project sees'
gh label create 'ci' --repo timhettler/radix-layout --color 5319e7 --description 'Repository automation'
gh label create 'agentic-workflows' --repo timhettler/radix-layout --color c5def5 --description 'Agent skills and instructions'
gh label create '@timhettler/config' --repo timhettler/radix-layout --color fbca04 --description 'Changes config/'
gh label create '@timhettler/radix-layout' --repo timhettler/radix-layout --color fbca04 --description 'Changes lib/'
gh label create '@timhettler/radix-layout-docs' --repo timhettler/radix-layout --color fbca04 --description 'Changes docs/'
```
