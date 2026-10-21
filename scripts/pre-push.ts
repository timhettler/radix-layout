// The whole-project checks a commit hook can't afford, run by `.husky/pre-push`. Early feedback
// only: CI's `Verify` job runs the full set. Run it by hand to check HEAD.

import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const BASE = "origin/main";

/**
 * Root paths no test reads. Turbo's `...[ref]` filter maps a change to a package by its directory, so
 * a root file selects nothing; every root path not listed here runs the full suite instead, which
 * makes a new root file slow rather than unchecked.
 */
const NO_TEST_INPUT = [
  /^(?:\.changeset|\.claude|\.github|\.husky|\.vscode|scripts)\//,
  /^[^/]+\.md$/,
  /^(?:tsconfig\.scripts\.json|\.prettierignore|\.gitignore|\.gitattributes|\.worktreeinclude|\.env\.example|lint-staged\.config\.m?js|commitlint\.config\.m?js)$/,
];

const PACKAGE_DIR = /^(?:config|lib|docs)\//;
const EXEC = ["yarn"];
const PM = "yarn";
const ZERO_SHA = /^0+$/;

const git = (...args: string[]): string =>
  execFileSync("git", args, { encoding: "utf8" }).trim();

function run(command: string, args: string[]): void {
  console.log(`\n▶ ${command} ${args.join(" ")}`);
  const { status, error } = spawnSync(command, args, { stdio: "inherit" });
  if (error) throw error;
  if (status !== 0) process.exit(status ?? 1);
}

/** The local SHAs this push sends to a branch. Git passes the remote as arguments, so none means a run by hand. */
function pushedHeads(): string[] {
  if (process.argv.length <= 2) return [git("rev-parse", "HEAD")];
  return readFileSync(0, "utf8")
    .split("\n")
    .map((line) => line.trim().split(/\s+/))
    .filter(([, localSha, remoteRef]) => {
      return (
        localSha &&
        !ZERO_SHA.test(localSha) &&
        remoteRef?.startsWith("refs/heads/")
      );
    })
    .map(([, localSha]) => localSha);
}

const uncommitted = (): string => git("status", "--porcelain");

if (process.env.CI) {
  console.log(
    "pre-push: skipped under CI, where the workflow runs its own checks.",
  );
  process.exit(0);
}

const heads = pushedHeads();
if (heads.length === 0) {
  console.log("pre-push: nothing pushed to a branch, so nothing to check.");
  process.exit(0);
}

// The checks read the working tree, so they vouch only for HEAD, and only while the tree is clean.
const head = git("rev-parse", "HEAD");
if (!heads.includes(head)) {
  console.log(
    `pre-push: skipped. This push doesn't send HEAD (${head}), and the checks read the working ` +
      "tree. Check the branch out to run them; CI runs them either way.",
  );
  process.exit(0);
}
const others = heads.filter((sha) => sha !== head);
if (others.length > 0) {
  console.log(
    `pre-push: checking HEAD only; this push also sends ${others.join(", ")}.`,
  );
}
const dirty = uncommitted();
if (dirty !== "") {
  console.log(
    `pre-push: skipped, because uncommitted changes would be checked instead of HEAD:\n${dirty}\n` +
      "Commit or stash them to run the checks; CI runs them either way.",
  );
  process.exit(0);
}

run(PM, ["run", "build"]);
run(PM, ["run", "typecheck"]);
run(PM, ["run", "lint"]);
run(PM, ["run", "check:markdown"]);

const regenerated = uncommitted();
if (regenerated !== "") {
  console.error(
    `pre-push: the build changed tracked files, so committed output is stale:\n${regenerated}`,
  );
  process.exit(1);
}

const exec = (...args: string[]) => run(EXEC[0], [...EXEC.slice(1), ...args]);

function mergeBase(): string | null {
  try {
    return git("merge-base", BASE, "HEAD");
  } catch {
    return null;
  }
}

const base = mergeBase();
if (base === null) {
  console.log(
    `\npre-push: can't resolve a merge base with ${BASE}, so testing everything.`,
  );
  exec("turbo", "run", "test", "--continue");
  process.exit(0);
}

// `--no-renames` so a moved file also reports its old path.
const outsidePackages = git("diff", "--name-only", "--no-renames", base, "HEAD")
  .split("\n")
  .filter(Boolean)
  .filter(
    (path) =>
      !PACKAGE_DIR.test(path) &&
      !NO_TEST_INPUT.some((pattern) => pattern.test(path)),
  );
if (outsidePackages.length > 0) {
  console.log(
    `\npre-push: testing everything, because these root paths can reach every suite:\n  ${outsidePackages.join("\n  ")}`,
  );
  exec("turbo", "run", "test", "--continue");
  process.exit(0);
}

console.log(
  `\npre-push: testing the packages affected since ${BASE} (${base.slice(0, 9)}).`,
);
exec("turbo", "run", "test", "--continue", `--filter=...[${base}]`);
