# radix-layout

Monorepo for [`@timhettler/radix-layout`](lib/README.md) — Every Layout's layout
primitives as Radix-style React components.

| Workspace | Package                         | Role                                        |
| --------- | ------------------------------- | ------------------------------------------- |
| `lib/`    | `@timhettler/radix-layout`      | the published library                       |
| `docs/`   | `@timhettler/radix-layout-docs` | Storybook — examples **and** the test suite |
| `config/` | `@timhettler/config`            | shared tsconfig / ESLint / Prettier         |

Decisions and plans: [`docs/decisions`](docs/decisions).

## Development (Node 22, Yarn 4)

```sh
nvm use
yarn
yarn workspace @timhettler/radix-layout-docs exec playwright install chromium
yarn build && yarn test
```
