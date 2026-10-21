import { relative } from "node:path";

// ESLint's configs live in lib/ and docs/; a file outside them has none, so it gets Prettier only.
const LINTED = /^(?:lib|docs)\//;
const quote = (files) => files.map((f) => JSON.stringify(f)).join(" ");

/**
 * No typecheck: tsc checks the whole project, so it can't be scoped to staged files. pre-push runs it.
 */
export default {
  "*.{ts,tsx,js,mjs,cjs}": (files) => {
    const linted = files.filter((f) => LINTED.test(relative(process.cwd(), f)));
    return [
      `prettier --write ${quote(files)}`,
      ...(linted.length ? [`eslint ${quote(linted)}`] : []),
    ];
  },
  "*.{json,md,css,yml,yaml}": "prettier --write",
};
