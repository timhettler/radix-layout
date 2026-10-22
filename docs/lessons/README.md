# Lessons

Mistakes that recur, one file per kind of work, such as `git-and-prs.md` or
`dev-environment.md`. Read the file for the work you're about to do. When
unsure, `grep -rl '<symptom>' docs/lessons/`.

**The bar for an entry.** Add one only if every line holds:

1. **Someone already got it wrong**, or predictably would.
2. **A minute in the code or its history wouldn't tell you.** No type, comment,
   test name, commit or PR already records it.
3. **It will still be true next quarter.** Anything that expires sooner is a
   plan item or a code comment.
4. **It isn't already in `CLAUDE.md` or a skill.** Those load anyway, and a
   second copy rots at its own rate. Write one when reality contradicts them.
5. **It's cross-cutting.** Something specific to one module goes in that
   module's docs.
6. **Tooling can't catch it.** If a linter or formatter could, teach the tooling
   instead.

**Anatomy.** A bulleted entry opens with its claim in bold, then gives the
mechanism, the symptom it shows, and what to do instead. Name the misleading
signal that makes the wrong diagnosis look right, and the tempting wrong fix.

**When an entry goes stale,** because a dependency was upgraded or a command
fixed, edit or delete it. A wrong lesson is worse than a missing one, because it
gets trusted.

A new file opens with `# <Kind of work>`, one sentence on its scope, and a link
back to this bar.
