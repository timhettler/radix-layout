export default {
  extends: ["@commitlint/config-conventional"],
  rules: { "scope-empty": [2, "always"] },
  // Dependabot capitalizes "Bump", which subject-case rejects, and can't be told not to.
  ignores: [(message) => /^(chore|ci): Bump /.test(message)],
};
