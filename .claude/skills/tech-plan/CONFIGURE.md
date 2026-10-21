# Configure the tech-plan skill

Writes `tech-plan.config.json` and `tech-plan.config.md` beside `SKILL.md`.

```bash
grep -rn -i 'plan' CLAUDE.md AGENTS.md 2>/dev/null           # what the instructions say about plans
find . -ipath '*plan*' -type d -not -path '*/node_modules/*'  # any existing plans directory
ls .claude/skills/                                            # the PR skill
gh issue list --state all --limit 50                          # any plan issues
gh repo view --json hasIssuesEnabled,hasProjectsEnabled,viewerPermission
gh auth status --active 2>&1 | grep -i 'scopes'               # `github` needs the `project` scope
```

**Pick the store.** An existing plans directory recommends `repo`, and existing
plan issues recommend `github`. Otherwise recommend `github` when Issues and
Projects are enabled, the user has `WRITE` or higher, and the token has the
`project` scope, and `repo` when any of those fails. Always ask: a managed
repository can hide Issues from some users even when detection passes.

**`github`:** use the Project linked to the repository, and ask if there are
several. If there's none, ask before creating and linking one:

```bash
gh repo view --json projectsV2 --jq '.projectsV2.Nodes[] | "\(.number) \(.title)"'
gh project create --owner <owner> --title <repo> --format json --jq .number
gh project link <number> --owner <owner> --repo <owner>/<repo>
```

Then check the Project:

```bash
gh api graphql -f owner=<owner> -F number=<number> -f query='
  query($owner: String!, $number: Int!) { repositoryOwner(login: $owner) { ... on ProjectV2Owner {
    projectV2(number: $number) { id viewerCanUpdate
      workflows(first: 20) { nodes { name enabled } } views(first: 20) { nodes { name layout } }
      field(name: "Status") { ... on ProjectV2SingleSelectField {
        id options { id name color description } } } } } } }' --jq '.data.repositoryOwner.projectV2'
```

`viewerCanUpdate` must be `true`, or recommend `repo`. Plans need a board, and
the "Item closed" workflow enabled, since that moves a closed plan to `Done`.
`gh` can't enable a workflow, so ask the user to turn it on in the Project's
settings. With no `BOARD_LAYOUT` view, add one; a board groups by `Status`:

```bash
gh api graphql -f project=<project id> -f query='mutation($project: ID!) {
  createProjectV2View(input: { projectId: $project, name: "Board", layout: BOARD_LAYOUT }) {
    projectV2View { name } } }'
```

`Status` needs `Todo`, `Parked`, `In Progress` and `Done`, and a new Project
lacks `Parked`. Ask before adding a missing option. The update replaces the
whole list, so pass every option the query printed with its `id`, or each item's
status is cleared:

```bash
gh api graphql -f field=<Status field id> -f query='mutation($field: ID!) {
  updateProjectV2Field(input: { fieldId: $field, singleSelectOptions: [
    { id: "<id>", name: "Todo", color: <as printed>, description: "<as printed>" },
    { name: "Parked", color: GRAY, description: "Deferred by decision, not waiting on anyone" },
    { id: "<id>", name: "In Progress", color: <as printed>, description: "<as printed>" },
    { id: "<id>", name: "Done", color: <as printed>, description: "<as printed>" } ] }) {
    projectV2Field { ... on ProjectV2SingleSelectField { options { name } } } } }'
```

**`repo`, with no existing plans:** use the defaults, `docs/planning/active` and
`docs/planning/archive`. Don't invent a layout. **Existing plans in another
shape:** ask once whether new plans use this skill's format (the old ones stay
as they are; migrating them is separate work) or whether to keep the repo's
directories. The sections and masthead are the skill's either way.

Also find the ADR and lessons directories, the command that formats one markdown
file, and the checks every plan in this repo ends with. Ask one question per
decision detection didn't settle, then write `tech-plan.config.json`. `plans` is
`null` in `github`, and `project` is `null` in `repo`:

```json
{
  "store": "<github or repo>",
  "plans": {
    "active": "docs/planning/active",
    "archive": "docs/planning/archive"
  },
  "project": { "owner": "<user or organization login>", "number": 1 },
  "format": "<command that formats one markdown file, or null>",
  "destinations": { "adr": "<dir or null>", "lessons": "<dir or null>" },
  "prSkill": "<skill that ships a branch>"
}
```

And `tech-plan.config.md`, with these headings; leave a section empty rather
than dropping its heading:

- `## Default steps` — the `- [ ]` items every plan here ends with, such as the
  full check command.
- `## Gotchas` — repository conventions with no key of their own, one bold-led
  bullet each.

Show the user both files, then return to `SKILL.md` § 0.

## Porting

Never hardcode a repository path or command in `SKILL.md`; it belongs in
`tech-plan.config.json` or `tech-plan.config.md`. To port, copy this directory
without `tech-plan.config.*` and run it.
