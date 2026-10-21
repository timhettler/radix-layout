# tech-plan — repository config

The prose half of [`tech-plan.config.json`](tech-plan.config.json). The skill
reads both; Configure writes both; porting leaves both behind.

## Default steps

- [ ] `yarn lint && yarn format:check && yarn check:markdown && yarn typecheck && yarn build && yarn test`
- [ ] A changeset for every consumer-facing change (`yarn changeset`)

## Gotchas

- **Active plans sit flat in `docs/decisions/planning/<slug>/`.** Only finished
  ones move, to `archive/<slug>/`.
- **Plans from before the skill** use `**Recorded:**` where the skill writes
  `**Started:**`, and a `stub` status. Leave them as they are; a plan the skill
  writes uses its own masthead.
