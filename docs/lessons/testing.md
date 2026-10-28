# Testing

Checking that a story proves what it claims, by breaking the CSS on purpose. The
bar for an entry is in [README.md](README.md).

- **Undo a mutation from a copy or from git, never by deleting the line you
  added.** A `sed '/^  flex-basis: 0;$/d'` meant to remove a mutated declaration
  from `_layout.scss` also removed the identical line in `sidebar-content`,
  which Sidebar's wrap needs. The symptom is unrelated stories failing after the
  cleanup, which reads as a flaky suite or a defect in the branch. Copy the file
  to `$TMPDIR` before mutating and copy it back, or `git checkout -- <file>`
  when the file has no uncommitted work, then run `git diff --stat` to check.
